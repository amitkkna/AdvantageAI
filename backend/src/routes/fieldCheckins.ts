import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { fieldCheckinSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// POST /api/field-checkins
router.post('/', authenticate, authorize('ADMIN', 'FIELD'), validate(fieldCheckinSchema), async (req: Request, res: Response) => {
  try {
    const checkin = await prisma.fieldCheckin.create({
      data: {
        ...req.body,
        userId: req.user!.userId,
        photoUrls: req.body.photoUrls || [],
      },
      include: { asset: { select: { id: true, code: true, name: true } } },
    });
    sendSuccess(res, checkin, 'Check-in recorded', 201);
  } catch (error) {
    sendError(res, 'Failed to create check-in');
  }
});

// GET /api/field-checkins
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { assetId } = req.query;
    const where: any = {};
    if (assetId) where.assetId = assetId;
    if (req.user!.role === 'FIELD') where.userId = req.user!.userId;

    const checkins = await prisma.fieldCheckin.findMany({
      where,
      include: {
        asset: { select: { id: true, code: true, name: true, city: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, checkins);
  } catch (error) {
    sendError(res, 'Failed to fetch check-ins');
  }
});

export default router;
