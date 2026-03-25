import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendPaginated, sendError, paginate } from '../utils/response';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const where = { userId: req.user!.userId };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    sendPaginated(res, notifications, { ...paginate(page, limit, total), unreadCount } as any);
  } catch (error) {
    sendError(res, 'Failed to fetch notifications');
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    sendError(res, 'Failed to update notification');
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    sendError(res, 'Failed to update notifications');
  }
});

export default router;
