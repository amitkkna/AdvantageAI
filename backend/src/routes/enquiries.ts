import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  createEnquirySchema, updateEnquirySchema, updateEnquiryStatusSchema,
  paginationSchema, VALID_ENQUIRY_TRANSITIONS,
} from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';
import { logActivity } from './activityLogs';

const router = Router();

// GET /api/enquiries
router.get('/', authenticate, authorize('ADMIN', 'SALES'), validate(paginationSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;
    const { status, priority, assignedToId, search } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: { select: { id: true, name: true } },
          client: { select: { id: true, companyName: true } },
          campaign: { select: { id: true, name: true } },
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enquiry.count({ where }),
    ]);
    sendPaginated(res, enquiries, paginate(page, limit, total));
  } catch (error) {
    console.error('Get enquiries error:', error);
    sendError(res, 'Failed to fetch enquiries');
  }
});

// GET /api/enquiries/:id
router.get('/:id', authenticate, authorize('ADMIN', 'SALES'), async (req: Request, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        client: true,
        campaign: { select: { id: true, name: true, status: true } },
        proposals: { select: { id: true, title: true, status: true, totalBudget: true } },
      },
    });
    if (!enquiry) { sendError(res, 'Enquiry not found', 404); return; }
    sendSuccess(res, enquiry);
  } catch (error) {
    sendError(res, 'Failed to fetch enquiry');
  }
});

// POST /api/enquiries
router.post('/', authenticate, authorize('ADMIN', 'SALES'), validate(createEnquirySchema), async (req: Request, res: Response) => {
  try {
    const data: any = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const enquiry = await prisma.enquiry.create({
      data,
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'ENQUIRY_CREATED' as const,
        title: 'New Enquiry Received',
        message: `New enquiry from ${enquiry.companyName} (${enquiry.contactPerson})`,
        metadata: { enquiryId: enquiry.id },
      })),
    });

    await logActivity(req.user!.userId, 'CREATE', 'Enquiry', enquiry.id, { enquiry }, req.ip);
    sendSuccess(res, enquiry, 'Enquiry created', 201);
  } catch (error) {
    console.error('Create enquiry error:', error);
    sendError(res, 'Failed to create enquiry');
  }
});

// PUT /api/enquiries/:id
router.put('/:id', authenticate, authorize('ADMIN', 'SALES'), validate(updateEnquirySchema), async (req: Request, res: Response) => {
  try {
    const data: any = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const before = await prisma.enquiry.findUnique({ where: { id: req.params.id } });
    const enquiry = await prisma.enquiry.update({
      where: { id: req.params.id },
      data,
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    await logActivity(req.user!.userId, 'UPDATE', 'Enquiry', enquiry.id, { before, after: enquiry }, req.ip);
    sendSuccess(res, enquiry, 'Enquiry updated');
  } catch (error) {
    sendError(res, 'Failed to update enquiry');
  }
});

// PATCH /api/enquiries/:id/status
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SALES'), validate(updateEnquiryStatusSchema), async (req: Request, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) { sendError(res, 'Enquiry not found', 404); return; }

    const { status: newStatus, lostReason } = req.body;
    const currentStatus = enquiry.status;
    const validTransitions = VALID_ENQUIRY_TRANSITIONS[currentStatus as keyof typeof VALID_ENQUIRY_TRANSITIONS] || [];

    if (!validTransitions.includes(newStatus)) {
      sendError(res, `Cannot transition from ${currentStatus} to ${newStatus}`, 400);
      return;
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'LOST' && lostReason) updateData.lostReason = lostReason;

    const updated = await prisma.enquiry.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await logActivity(req.user!.userId, 'STATUS_CHANGE', 'Enquiry', enquiry.id, { before: { status: currentStatus }, after: { status: newStatus } }, req.ip);
    sendSuccess(res, updated, 'Enquiry status updated');
  } catch (error) {
    sendError(res, 'Failed to update enquiry status');
  }
});

// POST /api/enquiries/:id/add-note
router.post('/:id/add-note', authenticate, authorize('ADMIN', 'SALES'), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) { sendError(res, 'Note text is required', 400); return; }

    const enquiry = await prisma.enquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) { sendError(res, 'Enquiry not found', 404); return; }

    const notes = (enquiry.notes as any[]) || [];
    notes.push({ text, by: req.user!.userId, at: new Date().toISOString() });

    const updated = await prisma.enquiry.update({
      where: { id: req.params.id },
      data: { notes },
    });
    sendSuccess(res, updated, 'Note added');
  } catch (error) {
    sendError(res, 'Failed to add note');
  }
});

// POST /api/enquiries/:id/convert - Convert enquiry to client + campaign
router.post('/:id/convert', authenticate, authorize('ADMIN', 'SALES'), async (req: Request, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) { sendError(res, 'Enquiry not found', 404); return; }
    if (enquiry.status === 'CONVERTED') { sendError(res, 'Enquiry already converted', 400); return; }
    if (enquiry.status === 'LOST') { sendError(res, 'Cannot convert a lost enquiry', 400); return; }

    const result = await prisma.$transaction(async (tx) => {
      // Find or create client
      let client = await tx.client.findUnique({ where: { email: enquiry.email } });
      if (!client) {
        client = await tx.client.create({
          data: {
            companyName: enquiry.companyName,
            contactPerson: enquiry.contactPerson,
            email: enquiry.email,
            phone: enquiry.phone,
            address: '',
            city: ((enquiry.cities as string[]) || [])[0] || '',
            industry: enquiry.industry || 'General',
          },
        });
      }

      // Create campaign
      const campaign = await tx.campaign.create({
        data: {
          name: `${enquiry.companyName} - Campaign`,
          clientId: client.id,
          startDate: enquiry.startDate || new Date(),
          endDate: enquiry.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          totalBudget: enquiry.budget || 0,
          description: enquiry.requirements || '',
          assignedToId: enquiry.assignedToId,
        },
      });

      // Update enquiry
      const updated = await tx.enquiry.update({
        where: { id: enquiry.id },
        data: {
          status: 'CONVERTED',
          clientId: client.id,
          campaignId: campaign.id,
          convertedAt: new Date(),
        },
      });

      return { enquiry: updated, client, campaign };
    });

    // Notify
    if (enquiry.assignedToId) {
      await prisma.notification.create({
        data: {
          userId: enquiry.assignedToId,
          type: 'ENQUIRY_CONVERTED',
          title: 'Enquiry Converted',
          message: `Enquiry from ${enquiry.companyName} has been converted to a campaign`,
          metadata: { enquiryId: enquiry.id, campaignId: result.campaign.id },
        },
      });
    }

    await logActivity(req.user!.userId, 'CONVERT', 'Enquiry', enquiry.id, { campaignId: result.campaign.id, clientId: result.client.id }, req.ip);
    sendSuccess(res, result, 'Enquiry converted to campaign');
  } catch (error) {
    console.error('Convert enquiry error:', error);
    sendError(res, 'Failed to convert enquiry');
  }
});

export default router;
