import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { createAssetSchema, updateAssetSchema, assetFilterSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';
import { AssetStatus } from '@advantage/shared';
import { logActivity } from './activityLogs';
import { calculateAssetScore, recalculateAllScores } from '../utils/assetScoring';

const router = Router();

// GET /api/assets - List with filters
router.get('/', authenticate, validate(assetFilterSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit, city, type, status, lighting, minPrice, maxPrice,
      startDate, endDate, vendorId, search, latitude, longitude, radius } = req.query as any;

    const where: any = {};
    if (city) where.city = city;
    if (type) where.type = type;
    if (status) where.status = status;
    if (lighting) where.lighting = lighting;
    if (vendorId) where.vendorId = vendorId;
    if (minPrice || maxPrice) {
      where.monthlyRate = {};
      if (minPrice) where.monthlyRate.gte = minPrice;
      if (maxPrice) where.monthlyRate.lte = maxPrice;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { landmark: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Radius search using Haversine approximation
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const r = parseFloat(radius);
      const latDelta = r / 111.32;
      const lngDelta = r / (111.32 * Math.cos(lat * Math.PI / 180));
      where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
      where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
    }

    // Exclude assets with conflicting availability blocks
    if (startDate && endDate) {
      where.NOT = {
        availabilityBlocks: {
          some: {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        },
      };
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vendor: { select: { id: true, name: true, reliabilityScore: true } },
          photos: { where: { isPrimary: true }, take: 1 },
          _count: { select: { bookings: true } },
        },
        orderBy: [{ score: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      }),
      prisma.asset.count({ where }),
    ]);

    sendPaginated(res, assets, paginate(page, limit, total));
  } catch (error) {
    console.error('Get assets error:', error);
    sendError(res, 'Failed to fetch assets');
  }
});

// POST /api/assets/recalculate-scores - Recalculate scores for all assets
router.post('/recalculate-scores', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const updated = await recalculateAllScores();
    await logActivity(req.user!.userId, 'UPDATE', 'Asset', undefined, { description: `Recalculated scores for ${updated} assets` }, req.ip);
    sendSuccess(res, { updated }, `Scores recalculated for ${updated} assets`);
  } catch (error) {
    console.error('Score recalculation error:', error);
    sendError(res, 'Failed to recalculate scores');
  }
});

// GET /api/assets/:id/score - Get score breakdown for a single asset
router.get('/:id/score', authenticate, async (req: Request, res: Response) => {
  try {
    const breakdown = await calculateAssetScore(req.params.id);
    sendSuccess(res, breakdown);
  } catch (error) {
    sendError(res, 'Failed to calculate asset score');
  }
});

// GET /api/assets/map - Map markers
router.get('/map', authenticate, async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const where: any = { status: { not: 'INACTIVE' } };
    if (city) where.city = city;

    const assets = await prisma.asset.findMany({
      where,
      select: {
        id: true, code: true, name: true, type: true, status: true,
        latitude: true, longitude: true, monthlyRate: true,
        photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });

    const markers = assets.map((a) => ({
      id: a.id, code: a.code, name: a.name, type: a.type, status: a.status,
      latitude: a.latitude, longitude: a.longitude, monthlyRate: a.monthlyRate,
      primaryPhotoUrl: a.photos?.[0]?.url || null,
      color: a.status === AssetStatus.AVAILABLE ? 'green'
        : a.status === AssetStatus.PARTIALLY_BOOKED ? 'orange'
        : a.status === AssetStatus.FULLY_BOOKED ? 'red'
        : 'grey',
    }));

    sendSuccess(res, markers);
  } catch (error) {
    sendError(res, 'Failed to fetch map markers');
  }
});

// GET /api/assets/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        photos: { orderBy: { isPrimary: 'desc' } },
        availabilityBlocks: { where: { endDate: { gte: new Date() } }, orderBy: { startDate: 'asc' } },
        bookings: {
          where: { status: { in: ['HOLD', 'CONFIRMED'] }, endDate: { gte: new Date() } },
          include: { campaign: { select: { id: true, name: true, client: { select: { companyName: true } } } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!asset) { sendError(res, 'Asset not found', 404); return; }
    sendSuccess(res, asset);
  } catch (error) {
    sendError(res, 'Failed to fetch asset');
  }
});

// POST /api/assets
router.post('/', authenticate, authorize('ADMIN', 'SALES'), validate(createAssetSchema), async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.create({
      data: req.body,
      include: { vendor: { select: { id: true, name: true } } },
    });
    sendSuccess(res, asset, 'Asset created', 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      sendError(res, 'Asset code already exists', 409);
      return;
    }
    sendError(res, 'Failed to create asset');
  }
});

// PUT /api/assets/:id
router.put('/:id', authenticate, authorize('ADMIN', 'SALES'), validate(updateAssetSchema), async (req: Request, res: Response) => {
  try {
    const before = await prisma.asset.findUnique({ where: { id: req.params.id } });
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: req.body,
      include: { vendor: { select: { id: true, name: true } } },
    });
    await logActivity(req.user!.userId, 'UPDATE', 'Asset', asset.id, { before, after: asset }, req.ip);
    sendSuccess(res, asset, 'Asset updated');
  } catch (error) {
    sendError(res, 'Failed to update asset');
  }
});

// DELETE /api/assets/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.asset.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' },
    });
    sendSuccess(res, null, 'Asset deactivated');
  } catch (error) {
    sendError(res, 'Failed to deactivate asset');
  }
});

// GET /api/assets/:id/availability - Availability calendar
router.get('/:id/availability', authenticate, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        assetId: req.params.id,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      orderBy: { startDate: 'asc' },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        assetId: req.params.id,
        status: { in: ['HOLD', 'CONFIRMED'] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: { campaign: { select: { name: true, client: { select: { companyName: true } } } } },
      orderBy: { startDate: 'asc' },
    });

    sendSuccess(res, { blocks, bookings });
  } catch (error) {
    sendError(res, 'Failed to fetch availability');
  }
});

export default router;
