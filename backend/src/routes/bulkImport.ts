import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { logActivity } from './activityLogs';

const router = Router();
const upload = multer({ dest: 'uploads/tmp/', limits: { fileSize: 5 * 1024 * 1024 } });

const ASSET_REQUIRED_FIELDS = ['name', 'code', 'type', 'city', 'address', 'latitude', 'longitude', 'width', 'height', 'monthlyRate'];
const CLIENT_REQUIRED_FIELDS = ['companyName', 'contactPerson', 'email', 'phone', 'city'];

// POST /api/bulk-import/preview
router.post('/preview', authenticate, authorize('ADMIN', 'SALES'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { sendError(res, 'No file uploaded', 400); return; }

    const entity = req.body.entity as string;
    if (!entity || !['Asset', 'Client'].includes(entity)) {
      sendError(res, 'entity must be Asset or Client', 400);
      return;
    }

    const csv = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);

    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true, transformHeader: (h: string) => h.trim() });

    if (!parsed.data || parsed.data.length === 0) {
      sendError(res, 'CSV is empty or invalid', 400);
      return;
    }

    const requiredFields = entity === 'Asset' ? ASSET_REQUIRED_FIELDS : CLIENT_REQUIRED_FIELDS;
    const headers = parsed.meta.fields || [];
    const missingHeaders = requiredFields.filter((f) => !headers.includes(f));

    if (missingHeaders.length > 0) {
      sendError(res, `Missing required columns: ${missingHeaders.join(', ')}`, 400);
      return;
    }

    const validRows: any[] = [];
    const invalidRows: { row: number; data: any; errors: string[] }[] = [];

    (parsed.data as any[]).forEach((row, index) => {
      const errors: string[] = [];

      for (const field of requiredFields) {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push(`${field} is required`);
        }
      }

      if (entity === 'Asset') {
        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);
        if (isNaN(lat) || lat < -90 || lat > 90) errors.push('Invalid latitude');
        if (isNaN(lng) || lng < -180 || lng > 180) errors.push('Invalid longitude');
        if (isNaN(parseFloat(row.width)) || parseFloat(row.width) <= 0) errors.push('Invalid width');
        if (isNaN(parseFloat(row.height)) || parseFloat(row.height) <= 0) errors.push('Invalid height');
        if (isNaN(parseFloat(row.monthlyRate)) || parseFloat(row.monthlyRate) <= 0) errors.push('Invalid monthlyRate');

        const validTypes = ['BILLBOARD', 'UNIPOLE', 'HOARDING', 'BUS_SHELTER', 'GANTRY', 'DIGITAL_SCREEN', 'WALL_WRAP', 'POLE_KIOSK'];
        if (row.type && !validTypes.includes(row.type.toUpperCase())) errors.push(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
      }

      if (entity === 'Client') {
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Invalid email');
      }

      if (errors.length > 0) {
        invalidRows.push({ row: index + 2, data: row, errors });
      } else {
        validRows.push(row);
      }
    });

    sendSuccess(res, {
      headers,
      totalRows: (parsed.data as any[]).length,
      validRows,
      invalidRows,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
    });
  } catch (error) {
    console.error('Bulk import preview error:', error);
    sendError(res, 'Failed to parse CSV');
  }
});

// POST /api/bulk-import/execute
router.post('/execute', authenticate, authorize('ADMIN', 'SALES'), async (req: Request, res: Response) => {
  try {
    const { entity, rows } = req.body;
    if (!entity || !rows || !Array.isArray(rows) || rows.length === 0) {
      sendError(res, 'entity and rows are required', 400);
      return;
    }

    if (rows.length > 500) {
      sendError(res, 'Maximum 500 rows per import', 400);
      return;
    }

    let created = 0;
    const errors: { row: number; error: string }[] = [];

    if (entity === 'Asset') {
      // Get or create a default vendor
      let vendor = await prisma.vendor.findFirst();
      if (!vendor) {
        vendor = await prisma.vendor.create({
          data: { name: 'Default Vendor', contactPerson: 'Admin', email: 'vendor@advantage.ai', phone: '9999999999', city: 'Raipur', state: 'Chhattisgarh' },
        });
      }

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          await prisma.asset.create({
            data: {
              name: row.name,
              code: row.code,
              type: row.type?.toUpperCase() || 'BILLBOARD',
              status: row.status?.toUpperCase() || 'AVAILABLE',
              address: row.address,
              city: row.city,
              state: row.state || 'Chhattisgarh',
              latitude: parseFloat(row.latitude),
              longitude: parseFloat(row.longitude),
              width: parseFloat(row.width),
              height: parseFloat(row.height),
              faces: parseInt(row.faces) || 1,
              lighting: row.lighting?.toUpperCase() || 'FRONT_LIT',
              monthlyRate: parseFloat(row.monthlyRate),
              dailyRate: row.dailyRate ? parseFloat(row.dailyRate) : null,
              landmark: row.landmark || null,
              trafficCount: row.trafficCount ? parseInt(row.trafficCount) : null,
              vendorId: vendor.id,
            },
          });
          created++;
        } catch (err: any) {
          errors.push({ row: i + 1, error: err.message || 'Creation failed' });
        }
      }
    } else if (entity === 'Client') {
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          await prisma.client.create({
            data: {
              companyName: row.companyName,
              contactPerson: row.contactPerson,
              email: row.email,
              phone: row.phone,
              address: row.address || '',
              city: row.city,
              state: row.state || 'Chhattisgarh',
              industry: row.industry || '',
              gstNumber: row.gstNumber || null,
            },
          });
          created++;
        } catch (err: any) {
          errors.push({ row: i + 1, error: err.message || 'Creation failed' });
        }
      }
    }

    await logActivity(req.user!.userId, 'CREATE', entity, undefined, { action: 'bulk_import', created, failed: errors.length }, req.ip);

    sendSuccess(res, { created, failed: errors.length, errors }, `${created} ${entity.toLowerCase()}s imported`);
  } catch (error) {
    console.error('Bulk import execute error:', error);
    sendError(res, 'Failed to execute import');
  }
});

// GET /api/bulk-import/template?entity=Asset
router.get('/template', authenticate, async (req: Request, res: Response) => {
  const entity = req.query.entity as string;
  let headers: string[];

  if (entity === 'Client') {
    headers = ['companyName', 'contactPerson', 'email', 'phone', 'address', 'city', 'state', 'industry', 'gstNumber'];
  } else {
    headers = ['name', 'code', 'type', 'status', 'address', 'city', 'state', 'latitude', 'longitude', 'width', 'height', 'faces', 'lighting', 'monthlyRate', 'dailyRate', 'landmark', 'trafficCount'];
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${entity?.toLowerCase() || 'import'}-template.csv`);
  res.send(headers.join(',') + '\n');
});

export default router;
