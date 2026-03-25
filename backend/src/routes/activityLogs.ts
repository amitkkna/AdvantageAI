import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendPaginated, paginate } from '../utils/response';

const router = Router();

// GET /api/activity-logs - List activity logs (admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const entity = req.query.entity as string;
    const action = req.query.action as string;
    const userId = req.query.userId as string;

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    sendPaginated(res, logs, paginate(page, limit, total));
  } catch (error) {
    console.error('Activity logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
});

// GET /api/activity-logs/entity/:entity/:entityId - History for a specific record
router.get('/entity/:entity/:entityId', authenticate, async (req: Request, res: Response) => {
  try {
    const { entity, entityId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where = { entity, entityId };
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    sendPaginated(res, logs, paginate(page, limit, total));
  } catch (error) {
    console.error('Entity activity logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch entity history' });
  }
});

export default router;

// Helper to log activity from other routes
export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
) {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entity, entityId, metadata, ipAddress },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
