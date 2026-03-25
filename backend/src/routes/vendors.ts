import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { createVendorSchema, updateVendorSchema, paginationSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';

const router = Router();

// GET /api/vendors
router.get('/', authenticate, validate(paginationSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;
    const where = { isActive: true };
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendor.count({ where }),
    ]);
    sendPaginated(res, vendors, paginate(page, limit, total));
  } catch (error) {
    console.error('Get vendors error:', error);
    sendError(res, 'Failed to fetch vendors');
  }
});

// GET /api/vendors/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: { assets: true, rentalAgreements: true },
    });
    if (!vendor) { sendError(res, 'Vendor not found', 404); return; }
    sendSuccess(res, vendor);
  } catch (error) {
    sendError(res, 'Failed to fetch vendor');
  }
});

// POST /api/vendors
router.post('/', authenticate, authorize('ADMIN', 'SALES'), validate(createVendorSchema), async (req: Request, res: Response) => {
  try {
    const vendor = await prisma.vendor.create({ data: req.body });
    sendSuccess(res, vendor, 'Vendor created', 201);
  } catch (error) {
    sendError(res, 'Failed to create vendor');
  }
});

// PUT /api/vendors/:id
router.put('/:id', authenticate, authorize('ADMIN', 'SALES'), validate(updateVendorSchema), async (req: Request, res: Response) => {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, vendor, 'Vendor updated');
  } catch (error) {
    sendError(res, 'Failed to update vendor');
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.vendor.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Vendor deactivated');
  } catch (error) {
    sendError(res, 'Failed to delete vendor');
  }
});

export default router;
