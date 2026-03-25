import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { reviewCreativeSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// GET /api/creatives
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { bookingId, status } = req.query;
    const where: any = {};
    if (bookingId) where.bookingId = bookingId;
    if (status) where.status = status;

    if (req.user!.role === 'CLIENT' && req.user!.clientId) {
      where.booking = { campaign: { clientId: req.user!.clientId } };
    }

    const creatives = await prisma.creative.findMany({
      where,
      include: {
        asset: { select: { id: true, code: true, name: true, width: true, height: true } },
        booking: { select: { id: true, campaign: { select: { name: true } } } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, creatives);
  } catch (error) {
    sendError(res, 'Failed to fetch creatives');
  }
});

// POST /api/creatives
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const creative = await prisma.creative.create({
      data: {
        ...req.body,
        uploadedById: req.user!.userId,
      },
    });

    // Notify admin
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'CREATIVE_UPLOADED' as const,
        title: 'New Creative Uploaded',
        message: `A new creative has been uploaded for review`,
        metadata: { creativeId: creative.id },
      })),
    });

    sendSuccess(res, creative, 'Creative uploaded', 201);
  } catch (error) {
    sendError(res, 'Failed to upload creative');
  }
});

// PATCH /api/creatives/:id/review
router.patch('/:id/review', authenticate, authorize('ADMIN', 'SALES'), validate(reviewCreativeSchema), async (req: Request, res: Response) => {
  try {
    const { status, rejectionReason, revisionNotes } = req.body;
    const creative = await prisma.creative.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason
          : status === 'REVISION_REQUESTED' ? (revisionNotes || rejectionReason)
          : null,
        reviewedById: req.user!.userId,
      },
    });

    // Determine notification type and message
    let notifType: string;
    let notifTitle: string;
    let notifMessage: string;

    switch (status) {
      case 'APPROVED':
        notifType = 'CREATIVE_APPROVED';
        notifTitle = 'Creative Approved';
        notifMessage = 'Your creative has been approved';
        break;
      case 'REJECTED':
        notifType = 'CREATIVE_REJECTED';
        notifTitle = 'Creative Rejected';
        notifMessage = `Your creative was rejected: ${rejectionReason || 'No reason provided'}`;
        break;
      case 'REVISION_REQUESTED':
        notifType = 'CREATIVE_REVISION_REQUESTED';
        notifTitle = 'Creative Revision Requested';
        notifMessage = `Revisions requested for your creative: ${revisionNotes || rejectionReason || 'Please check and resubmit'}`;
        break;
      default:
        notifType = 'CREATIVE_REJECTED';
        notifTitle = `Creative ${status.toLowerCase()}`;
        notifMessage = `Creative status changed to ${status}`;
    }

    await prisma.notification.create({
      data: {
        userId: creative.uploadedById,
        type: notifType as any,
        title: notifTitle,
        message: notifMessage,
        metadata: { creativeId: creative.id },
      },
    });

    sendSuccess(res, creative, `Creative ${status.toLowerCase().replace('_', ' ')}`);
  } catch (error) {
    sendError(res, 'Failed to review creative');
  }
});

// PATCH /api/creatives/:id/resubmit — Client resubmits after revision request
router.patch('/:id/resubmit', authenticate, async (req: Request, res: Response) => {
  try {
    const creative = await prisma.creative.findUnique({ where: { id: req.params.id } });
    if (!creative) { sendError(res, 'Creative not found', 404); return; }

    if (creative.status !== 'REVISION_REQUESTED' && creative.status !== 'REJECTED') {
      sendError(res, 'Creative is not in a state that allows resubmission', 400);
      return;
    }

    const updated = await prisma.creative.update({
      where: { id: req.params.id },
      data: {
        status: 'PENDING',
        fileUrl: req.body.fileUrl || creative.fileUrl,
        fileName: req.body.fileName || creative.fileName,
        rejectionReason: null,
        reviewedById: null,
      },
    });

    // Notify admins about resubmission
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'CREATIVE_UPLOADED' as const,
        title: 'Creative Resubmitted',
        message: `A creative has been resubmitted for review after revision`,
        metadata: { creativeId: updated.id },
      })),
    });

    sendSuccess(res, updated, 'Creative resubmitted for review');
  } catch (error) {
    sendError(res, 'Failed to resubmit creative');
  }
});

export default router;
