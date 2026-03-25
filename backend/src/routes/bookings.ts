import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { createBookingSchema, updateBookingStatusSchema, paginationSchema, HOLD_DURATION_HOURS } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';

const router = Router();

// GET /api/bookings
router.get('/', authenticate, validate(paginationSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;
    const { campaignId, assetId, status } = req.query;
    const where: any = {};
    if (campaignId) where.campaignId = campaignId;
    if (assetId) where.assetId = assetId;
    if (status) where.status = status;

    if (req.user!.role === 'CLIENT' && req.user!.clientId) {
      where.campaign = { clientId: req.user!.clientId };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          asset: { select: { id: true, code: true, name: true, city: true, type: true } },
          campaign: { select: { id: true, name: true, client: { select: { companyName: true } } } },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.booking.count({ where }),
    ]);
    sendPaginated(res, bookings, paginate(page, limit, total));
  } catch (error) {
    sendError(res, 'Failed to fetch bookings');
  }
});

// POST /api/bookings - Create with availability lock
router.post('/', authenticate, authorize('ADMIN', 'SALES'), validate(createBookingSchema), async (req: Request, res: Response) => {
  try {
    const { campaignId, assetId, startDate, endDate, amount } = req.body;

    // Use serializable transaction to prevent double-booking
    const result = await prisma.$transaction(async (tx) => {
      // Check for conflicting bookings
      const conflicts = await tx.booking.findMany({
        where: {
          assetId,
          status: { in: ['HOLD', 'CONFIRMED'] },
          startDate: { lte: new Date(endDate) },
          endDate: { gte: new Date(startDate) },
        },
      });

      if (conflicts.length > 0) {
        throw new Error('CONFLICT: Asset is not available for the selected dates');
      }

      // Create booking with hold
      const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_HOURS * 60 * 60 * 1000);
      const booking = await tx.booking.create({
        data: {
          campaignId,
          assetId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          amount,
          status: 'HOLD',
          holdExpiresAt,
        },
        include: {
          asset: { select: { id: true, code: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
      });

      // Create availability block
      await tx.availabilityBlock.create({
        data: {
          assetId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          bookingId: booking.id,
          reason: `Booking ${booking.id} - Hold`,
        },
      });

      return booking;
    }, { isolationLevel: 'Serializable' });

    sendSuccess(res, result, 'Booking created with 24h hold', 201);
  } catch (error: any) {
    if (error.message?.startsWith('CONFLICT:')) {
      sendError(res, error.message.replace('CONFLICT: ', ''), 409);
      return;
    }
    console.error('Create booking error:', error);
    sendError(res, 'Failed to create booking');
  }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SALES'), validate(updateBookingStatusSchema), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) { sendError(res, 'Booking not found', 404); return; }

    const updateData: any = { status };
    if (status === 'CONFIRMED') {
      updateData.holdExpiresAt = null;
    }
    if (status === 'CANCELLED') {
      // Remove availability block
      await prisma.availabilityBlock.deleteMany({
        where: { bookingId: booking.id },
      });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        asset: { select: { id: true, code: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });

    sendSuccess(res, updated, `Booking ${status.toLowerCase()}`);
  } catch (error) {
    sendError(res, 'Failed to update booking');
  }
});

// GET /api/bookings/calendar - Gantt data
router.get('/calendar', authenticate, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, city } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    const assetWhere: any = { status: { not: 'INACTIVE' } };
    if (city) assetWhere.city = city;

    const assets = await prisma.asset.findMany({
      where: assetWhere,
      select: {
        id: true, code: true, name: true, city: true, type: true,
        bookings: {
          where: {
            status: { in: ['HOLD', 'CONFIRMED'] },
            startDate: { lte: end },
            endDate: { gte: start },
          },
          select: {
            id: true, startDate: true, endDate: true, status: true,
            campaign: { select: { name: true, client: { select: { companyName: true } } } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    sendSuccess(res, assets);
  } catch (error) {
    sendError(res, 'Failed to fetch calendar');
  }
});

export default router;
