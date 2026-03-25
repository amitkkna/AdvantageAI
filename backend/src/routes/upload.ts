import { Router, Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';
import { UPLOAD } from '@advantage/shared';

const router = Router();

// S3 client (only init if AWS configured)
let s3Client: S3Client | null = null;
if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// Local upload fallback
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    cb(null, `${uuid()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = [...UPLOAD.ALLOWED_IMAGE_TYPES, ...UPLOAD.ALLOWED_DOC_TYPES];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// POST /api/upload/presigned - Get presigned S3 URL
router.post('/presigned', authenticate, async (req: Request, res: Response) => {
  try {
    if (!s3Client) {
      sendError(res, 'S3 not configured, use /api/upload/file instead', 400);
      return;
    }

    const { fileName, fileType, folder = 'general' } = req.body;
    if (!fileName || !fileType) {
      sendError(res, 'fileName and fileType required', 400);
      return;
    }

    const key = `${folder}/${uuid()}${path.extname(fileName)}`;
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const fileUrl = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    sendSuccess(res, { uploadUrl, fileUrl, key });
  } catch (error) {
    sendError(res, 'Failed to generate presigned URL');
  }
});

// POST /api/upload/file - Direct file upload (local fallback)
router.post('/file', authenticate, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  sendSuccess(res, { fileUrl, fileName: req.file.originalname, fileType: req.file.mimetype });
});

// POST /api/upload/photos - Multiple photo upload
router.post('/photos', authenticate, upload.array('photos', UPLOAD.MAX_PHOTOS_PER_ASSET), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    sendError(res, 'No files uploaded', 400);
    return;
  }

  const urls = files.map((f) => ({
    fileUrl: `/uploads/${f.filename}`,
    fileName: f.originalname,
    fileType: f.mimetype,
  }));

  sendSuccess(res, urls);
});

export default router;
