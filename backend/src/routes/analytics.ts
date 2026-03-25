import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { redis } from '../config/redis';

const router = Router();

// GET /api/analytics/admin/dashboard
router.get('/admin/dashboard', authenticate, authorize('ADMIN', 'SALES', 'FINANCE'), async (_req: Request, res: Response) => {
  try {
    // Check cache
    if (redis) {
      const cached = await redis.get('admin:dashboard');
      if (cached) { sendSuccess(res, JSON.parse(cached)); return; }
    }

    const [
      totalAssets, availableAssets, activeCampaigns, totalClients,
      pendingInvoices, revenueData, outstandingData
    ] = await Promise.all([
      prisma.asset.count({ where: { status: { not: 'INACTIVE' } } }),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.campaign.count({ where: { status: { in: ['LIVE', 'CREATIVE_APPROVED', 'CREATIVE_PENDING'] } } }),
      prisma.client.count({ where: { isActive: true } }),
      prisma.invoice.count({ where: { status: { in: ['SENT', 'OVERDUE'] } } }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { status: { in: ['SENT', 'OVERDUE'] } }, _sum: { totalAmount: true } }),
    ]);

    const occupancyRate = totalAssets > 0 ? Math.round(((totalAssets - availableAssets) / totalAssets) * 100) : 0;
    const totalRevenue = revenueData._sum.totalAmount || 0;
    const outstandingAmount = outstandingData._sum.totalAmount || 0;

    const data = {
      totalAssets,
      availableAssets,
      occupancyRate,
      totalRevenue,
      revenueTarget: totalRevenue * 1.2, // 20% growth target
      activeCampaigns,
      totalClients,
      pendingInvoices,
      outstandingAmount,
    };

    if (redis) {
      await redis.setex('admin:dashboard', 300, JSON.stringify(data)); // 5min cache
    }

    sendSuccess(res, data);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    sendError(res, 'Failed to fetch dashboard');
  }
});

// GET /api/analytics/client/dashboard
router.get('/client/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const clientId = req.user!.clientId;
    if (!clientId) { sendError(res, 'Client not found', 404); return; }

    const [activeCampaigns, totalBookings, spendData, analyticsData] = await Promise.all([
      prisma.campaign.count({ where: { clientId, status: { in: ['LIVE', 'CREATIVE_APPROVED'] } } }),
      prisma.booking.count({ where: { campaign: { clientId }, status: { in: ['HOLD', 'CONFIRMED'] } } }),
      prisma.invoice.aggregate({ where: { clientId, status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.campaignAnalytics.aggregate({
        where: { campaign: { clientId } },
        _sum: { impressions: true, reach: true },
        _avg: { cpm: true },
      }),
    ]);

    // Days remaining in active campaigns
    const activeCamp = await prisma.campaign.findFirst({
      where: { clientId, status: 'LIVE' },
      orderBy: { endDate: 'asc' },
    });
    const daysRemaining = activeCamp
      ? Math.max(0, Math.ceil((new Date(activeCamp.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    sendSuccess(res, {
      activeCampaigns,
      totalBookings,
      totalSpend: spendData._sum.totalAmount || 0,
      daysRemaining,
      impressions: analyticsData._sum.impressions || 0,
      reach: analyticsData._sum.reach || 0,
      avgCpm: Math.round((analyticsData._avg.cpm || 0) * 100) / 100,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch client dashboard');
  }
});

// GET /api/analytics/campaign/:id
router.get('/campaign/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const analytics = await prisma.campaignAnalytics.findMany({
      where: { campaignId: req.params.id },
      orderBy: { date: 'asc' },
    });
    sendSuccess(res, analytics);
  } catch (error) {
    sendError(res, 'Failed to fetch campaign analytics');
  }
});

// GET /api/analytics/campaign/:id/roi
router.get('/campaign/:id/roi', authenticate, async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          include: {
            asset: { select: { id: true, name: true, code: true } },
            analytics: true,
          },
        },
        invoices: { where: { status: 'PAID' } },
      },
    });

    if (!campaign) { sendError(res, 'Campaign not found', 404); return; }

    const totalSpend = campaign.bookings.reduce((sum, b) => sum + b.amount, 0);
    const totalImpressions = campaign.bookings.reduce((sum, b) =>
      sum + b.analytics.reduce((s, a) => s + a.impressions, 0), 0);
    const totalReach = campaign.bookings.reduce((sum, b) =>
      sum + b.analytics.reduce((s, a) => s + a.reach, 0), 0);

    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const costPerReach = totalReach > 0 ? totalSpend / totalReach : 0;
    const budgetUtilization = campaign.totalBudget > 0 ? (totalSpend / campaign.totalBudget) * 100 : 0;

    // Daily trend
    const dailyMap: Record<string, { impressions: number; reach: number }> = {};
    campaign.bookings.forEach((b) => {
      b.analytics.forEach((a) => {
        const d = a.date.toISOString().slice(0, 10);
        if (!dailyMap[d]) dailyMap[d] = { impressions: 0, reach: 0 };
        dailyMap[d].impressions += a.impressions;
        dailyMap[d].reach += a.reach;
      });
    });

    const bookingBreakdown = campaign.bookings.map((b) => {
      const imp = b.analytics.reduce((s, a) => s + a.impressions, 0);
      const reach = b.analytics.reduce((s, a) => s + a.reach, 0);
      return {
        bookingId: b.id,
        assetName: b.asset.name,
        assetCode: b.asset.code,
        amount: b.amount,
        impressions: imp,
        reach,
        cpm: imp > 0 ? (b.amount / imp) * 1000 : 0,
      };
    });

    sendSuccess(res, {
      summary: {
        totalSpend,
        totalBudget: campaign.totalBudget,
        totalImpressions,
        totalReach,
        cpm: Math.round(cpm * 100) / 100,
        costPerReach: Math.round(costPerReach * 100) / 100,
        budgetUtilization: Math.round(budgetUtilization),
      },
      dailyTrend: Object.entries(dailyMap).sort().map(([date, d]) => ({ date, ...d })),
      bookingBreakdown,
    });
  } catch (error) {
    console.error('Campaign ROI error:', error);
    sendError(res, 'Failed to calculate ROI');
  }
});

// GET /api/analytics/revenue
router.get('/revenue', authenticate, authorize('ADMIN', 'FINANCE'), async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const invoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: startDate }, status: 'PAID' },
      select: { totalAmount: true, paidAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    invoices.forEach((inv) => {
      const date = inv.paidAt || inv.createdAt;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + inv.totalAmount;
    });

    sendSuccess(res, Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })));
  } catch (error) {
    sendError(res, 'Failed to fetch revenue data');
  }
});

// GET /api/analytics/utilization
router.get('/utilization', authenticate, authorize('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { status: { not: 'INACTIVE' } },
      select: {
        id: true, code: true, name: true, city: true, latitude: true, longitude: true, monthlyRate: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, endDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
          select: { startDate: true, endDate: true, amount: true },
        },
      },
    });

    const utilization = assets.map((asset) => {
      const totalDays = 365;
      const bookedDays = asset.bookings.reduce((sum, b) => {
        const days = Math.ceil((b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      const revenue = asset.bookings.reduce((sum, b) => sum + b.amount, 0);
      return {
        id: asset.id, code: asset.code, name: asset.name, city: asset.city,
        latitude: asset.latitude, longitude: asset.longitude,
        utilizationRate: Math.round((bookedDays / totalDays) * 100),
        revenue, monthlyRate: asset.monthlyRate,
      };
    });

    sendSuccess(res, utilization);
  } catch (error) {
    sendError(res, 'Failed to fetch utilization data');
  }
});

export default router;
