import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { createCampaignSchema, updateCampaignSchema, updateCampaignStatusSchema, paginationSchema, VALID_STATUS_TRANSITIONS } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize, clientScope } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';
import { logActivity } from './activityLogs';

const router = Router();

// GET /api/campaigns
router.get('/', authenticate, validate(paginationSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;
    const { status } = req.query;

    const where: any = {};
    if (req.user!.role === 'CLIENT' && req.user!.clientId) {
      where.clientId = req.user!.clientId;
    }
    if (status) where.status = status;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: { select: { id: true, companyName: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count({ where }),
    ]);
    sendPaginated(res, campaigns, paginate(page, limit, total));
  } catch (error) {
    sendError(res, 'Failed to fetch campaigns');
  }
});

// GET /api/campaigns/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const where: any = { id: req.params.id };
    if (req.user!.role === 'CLIENT' && req.user!.clientId) {
      where.clientId = req.user!.clientId;
    }

    const campaign = await prisma.campaign.findFirst({
      where,
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        bookings: { include: { asset: { include: { photos: { where: { isPrimary: true }, take: 1 } } } } },
        proposals: true,
        invoices: true,
      },
    });
    if (!campaign) { sendError(res, 'Campaign not found', 404); return; }
    sendSuccess(res, campaign);
  } catch (error) {
    sendError(res, 'Failed to fetch campaign');
  }
});

// POST /api/campaigns
router.post('/', authenticate, authorize('ADMIN', 'SALES'), validate(createCampaignSchema), async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.create({
      data: req.body,
      include: { client: { select: { id: true, companyName: true } } },
    });
    sendSuccess(res, campaign, 'Campaign created', 201);
  } catch (error) {
    sendError(res, 'Failed to create campaign');
  }
});

// PUT /api/campaigns/:id
router.put('/:id', authenticate, authorize('ADMIN', 'SALES'), validate(updateCampaignSchema), async (req: Request, res: Response) => {
  try {
    const before = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: req.body,
      include: { client: { select: { id: true, companyName: true } } },
    });
    await logActivity(req.user!.userId, 'UPDATE', 'Campaign', campaign.id, { before, after: campaign }, req.ip);
    sendSuccess(res, campaign, 'Campaign updated');
  } catch (error) {
    sendError(res, 'Failed to update campaign');
  }
});

// PATCH /api/campaigns/:id/status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SALES'), validate(updateCampaignStatusSchema), async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) { sendError(res, 'Campaign not found', 404); return; }

    const { status: newStatus } = req.body;
    const currentStatus = campaign.status;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus as keyof typeof VALID_STATUS_TRANSITIONS] || [];

    if (!validTransitions.includes(newStatus)) {
      sendError(res, `Cannot transition from ${currentStatus} to ${newStatus}`, 400);
      return;
    }

    // Approval gate: campaign cannot go LIVE unless all bookings have approved creatives
    if (newStatus === 'LIVE') {
      const bookings = await prisma.booking.findMany({
        where: { campaignId: campaign.id, status: 'CONFIRMED' },
        include: { creatives: { select: { status: true } } },
      });

      if (bookings.length === 0) {
        sendError(res, 'Campaign cannot go live without confirmed bookings', 400);
        return;
      }

      const bookingsWithoutApprovedCreative = bookings.filter(
        (b) => !b.creatives.some((c) => c.status === 'APPROVED')
      );
      if (bookingsWithoutApprovedCreative.length > 0) {
        sendError(res, `${bookingsWithoutApprovedCreative.length} booking(s) do not have approved creatives. All bookings must have at least one approved creative before going live.`, 400);
        return;
      }
    }

    // Approval gate: CREATIVE_APPROVED requires at least one approved creative
    if (newStatus === 'CREATIVE_APPROVED') {
      const approvedCreatives = await prisma.creative.count({
        where: {
          booking: { campaignId: campaign.id },
          status: 'APPROVED',
        },
      });
      if (approvedCreatives === 0) {
        sendError(res, 'No approved creatives found. At least one creative must be approved.', 400);
        return;
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { status: newStatus },
    });

    await logActivity(req.user!.userId, 'STATUS_CHANGE', 'Campaign', campaign.id, { before: { status: currentStatus }, after: { status: newStatus } }, req.ip);

    // Create notification
    await prisma.notification.create({
      data: {
        userId: campaign.assignedToId || req.user!.userId,
        type: 'CAMPAIGN_STATUS_CHANGE',
        title: 'Campaign Status Updated',
        message: `Campaign "${campaign.name}" status changed from ${currentStatus} to ${newStatus}`,
        metadata: { campaignId: campaign.id, oldStatus: currentStatus, newStatus },
      },
    });

    sendSuccess(res, updated, 'Campaign status updated');
  } catch (error) {
    sendError(res, 'Failed to update campaign status');
  }
});

export default router;
