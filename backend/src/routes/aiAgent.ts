import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { agentChat, logAiDecision, generateDailyInsights } from '../services/aiAgent';

const router = Router();

// POST /api/ai-agent/chat — Conversational AI agent
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      sendError(res, 'Message is required', 400);
      return;
    }

    // Convert history to Anthropic format
    const conversationHistory = (history || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const result = await agentChat(message, conversationHistory);

    // Log the interaction
    await logAiDecision({
      action: 'chat',
      input: { message, userId: req.user!.userId },
      output: { response: result.response.substring(0, 500), toolsUsed: result.toolsUsed },
    });

    sendSuccess(res, {
      message: result.response,
      toolsUsed: result.toolsUsed,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error('AI agent chat error:', error);
    sendError(res, error.message || 'AI agent failed to process your request');
  }
});

// GET /api/ai-agent/insights — Get recent AI insights
router.get('/insights', authenticate, authorize('ADMIN', 'SALES', 'FINANCE'), async (req: Request, res: Response) => {
  try {
    const { status, type, limit } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const insights = await prisma.aiInsight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string) || 20,
    });

    sendSuccess(res, insights);
  } catch (error) {
    sendError(res, 'Failed to fetch insights');
  }
});

// PATCH /api/ai-agent/insights/:id — Update insight status (ACTED, DISMISSED)
router.patch('/insights/:id', authenticate, authorize('ADMIN', 'SALES', 'FINANCE'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['VIEWED', 'ACTED', 'DISMISSED'].includes(status)) {
      sendError(res, 'Invalid status. Must be VIEWED, ACTED, or DISMISSED', 400);
      return;
    }

    const updateData: any = { status };
    if (status === 'ACTED') updateData.actedAt = new Date();
    if (status === 'DISMISSED') updateData.dismissedAt = new Date();

    const insight = await prisma.aiInsight.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Log this decision for the learning loop
    await logAiDecision({
      insightId: insight.id,
      action: `insight_${status.toLowerCase()}`,
      input: { insightType: insight.type, insightTitle: insight.title },
      output: { status },
    });

    sendSuccess(res, insight);
  } catch (error) {
    sendError(res, 'Failed to update insight');
  }
});

// GET /api/ai-agent/quick-stats — Quick business stats for the AI widget
router.get('/quick-stats', authenticate, async (_req: Request, res: Response) => {
  try {
    const [
      totalRevenue,
      overdueInvoices,
      activeCount,
      newEnquiries,
      pendingCreatives,
      occupancy,
    ] = await Promise.all([
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.campaign.count({ where: { status: { in: ['LIVE', 'CREATIVE_APPROVED', 'CREATIVE_PENDING'] } } }),
      prisma.enquiry.count({ where: { status: 'NEW' } }),
      prisma.creative.count({ where: { status: 'PENDING' } }),
      Promise.all([
        prisma.asset.count(),
        prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      ]),
    ]);

    const [totalAssets, availableAssets] = occupancy;
    const occupancyRate = totalAssets > 0 ? Math.round(((totalAssets - availableAssets) / totalAssets) * 100) : 0;

    sendSuccess(res, {
      revenue: totalRevenue._sum.totalAmount || 0,
      overdueInvoices,
      activeCampaigns: activeCount,
      newEnquiries,
      pendingCreatives,
      occupancyRate,
      totalAssets,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch quick stats');
  }
});

// POST /api/ai-agent/generate-insights — Manually trigger insight generation
router.post('/generate-insights', authenticate, authorize('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const insights = await generateDailyInsights();
    sendSuccess(res, insights, `Generated ${insights.length} insights`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to generate insights');
  }
});

export default router;
