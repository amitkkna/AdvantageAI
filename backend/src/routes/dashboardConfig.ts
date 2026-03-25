import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

const DEFAULT_WIDGETS = [
  { id: 'kpi-totalAssets', visible: true, order: 0 },
  { id: 'kpi-occupancy', visible: true, order: 1 },
  { id: 'kpi-activeCampaigns', visible: true, order: 2 },
  { id: 'kpi-totalRevenue', visible: true, order: 3 },
  { id: 'kpi-pendingInvoices', visible: true, order: 4 },
  { id: 'kpi-totalClients', visible: true, order: 5 },
  { id: 'chart-revenue', visible: true, order: 6 },
  { id: 'chart-occupancy', visible: true, order: 7 },
];

// GET /api/dashboard-config
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const config = await prisma.userDashboardConfig.findUnique({
      where: { userId: req.user!.userId },
    });
    sendSuccess(res, config ? config.widgets : DEFAULT_WIDGETS);
  } catch (error) {
    sendError(res, 'Failed to fetch dashboard config');
  }
});

// PUT /api/dashboard-config
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { widgets } = req.body;
    if (!Array.isArray(widgets)) {
      sendError(res, 'widgets must be an array', 400);
      return;
    }

    const config = await prisma.userDashboardConfig.upsert({
      where: { userId: req.user!.userId },
      update: { widgets },
      create: { userId: req.user!.userId, widgets },
    });
    sendSuccess(res, config.widgets, 'Dashboard config saved');
  } catch (error) {
    sendError(res, 'Failed to save dashboard config');
  }
});

export default router;
