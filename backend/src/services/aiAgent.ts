import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database';
import { env } from '../config/env';

const SYSTEM_PROMPT = `You are the AdVantage AI Operations Agent — an intelligent assistant for an outdoor advertising (OOH) business management platform.

You have access to tools that query the business database. Use them to answer questions, provide insights, and make strategic recommendations.

Your capabilities:
- Revenue & financial analysis
- Asset occupancy & performance tracking
- Campaign performance insights
- Enquiry pipeline analysis
- Client relationship intelligence
- Demand forecasting based on historical patterns
- Anomaly detection (unusual drops/spikes)

When providing insights:
- Always use specific numbers and data from tool results
- Compare with previous periods when relevant
- Highlight actionable recommendations
- Use INR (₹) for currency formatting
- Be concise but thorough

Current date: ${new Date().toISOString().split('T')[0]}`;

// Tool definitions for the agent
const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'query_revenue',
    description: 'Query revenue data. Returns total invoiced, collected, pending, and overdue amounts. Can filter by date range and client.',
    input_schema: {
      type: 'object' as const,
      properties: {
        startDate: { type: 'string', description: 'Start date (ISO format, optional)' },
        endDate: { type: 'string', description: 'End date (ISO format, optional)' },
        clientId: { type: 'string', description: 'Filter by client ID (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'query_assets',
    description: 'Query asset inventory and occupancy. Returns counts by status, type, city, and top/underperforming assets.',
    input_schema: {
      type: 'object' as const,
      properties: {
        city: { type: 'string', description: 'Filter by city (optional)' },
        type: { type: 'string', description: 'Filter by asset type (optional)' },
        status: { type: 'string', description: 'Filter by status (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'query_bookings',
    description: 'Query booking data. Returns booking counts by status, upcoming expirations, revenue by period.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter by status (HOLD, CONFIRMED, CANCELLED, COMPLETED)' },
        startDate: { type: 'string', description: 'Start date range (optional)' },
        endDate: { type: 'string', description: 'End date range (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'query_enquiries',
    description: 'Query enquiry/lead pipeline. Returns counts by status, conversion rates, average time to convert.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter by status (optional)' },
        assignedToId: { type: 'string', description: 'Filter by assigned user (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'query_campaigns',
    description: 'Query campaign data. Returns campaigns by status, budget utilization, and performance metrics.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter by campaign status (optional)' },
        clientId: { type: 'string', description: 'Filter by client (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'query_clients',
    description: 'Query client data. Returns client list with their campaign count, total spend, and activity.',
    input_schema: {
      type: 'object' as const,
      properties: {
        industry: { type: 'string', description: 'Filter by industry (optional)' },
        sortBy: { type: 'string', description: 'Sort by: spend, campaigns, recent (default: spend)' },
      },
      required: [],
    },
  },
  {
    name: 'compare_periods',
    description: 'Compare business metrics between two time periods (e.g., this month vs last month).',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric: { type: 'string', description: 'Metric to compare: revenue, bookings, enquiries, occupancy' },
        period1Start: { type: 'string', description: 'Period 1 start date (ISO)' },
        period1End: { type: 'string', description: 'Period 1 end date (ISO)' },
        period2Start: { type: 'string', description: 'Period 2 start date (ISO)' },
        period2End: { type: 'string', description: 'Period 2 end date (ISO)' },
      },
      required: ['metric', 'period1Start', 'period1End', 'period2Start', 'period2End'],
    },
  },
  {
    name: 'get_anomalies',
    description: 'Detect anomalies and notable changes in business data. Finds unusual patterns in revenue, bookings, or occupancy.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lookbackDays: { type: 'number', description: 'Number of days to analyze (default: 30)' },
      },
      required: [],
    },
  },
];

// Tool execution functions
async function executeQueryRevenue(input: any) {
  const where: any = {};
  if (input.startDate) where.createdAt = { gte: new Date(input.startDate) };
  if (input.endDate) where.createdAt = { ...where.createdAt, lte: new Date(input.endDate) };
  if (input.clientId) where.clientId = input.clientId;

  const [total, paid, overdue, pending, recentInvoices] = await Promise.all([
    prisma.invoice.aggregate({ where, _sum: { totalAmount: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...where, status: 'PAID' }, _sum: { totalAmount: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...where, status: 'OVERDUE' }, _sum: { totalAmount: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...where, status: { in: ['DRAFT', 'SENT'] } }, _sum: { totalAmount: true }, _count: true }),
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { client: { select: { companyName: true } }, campaign: { select: { name: true } } },
    }),
  ]);

  return JSON.stringify({
    totalInvoiced: total._sum.totalAmount || 0,
    totalCount: total._count,
    collected: paid._sum.totalAmount || 0,
    collectedCount: paid._count,
    overdue: overdue._sum.totalAmount || 0,
    overdueCount: overdue._count,
    pending: pending._sum.totalAmount || 0,
    pendingCount: pending._count,
    collectionRate: total._count > 0 ? Math.round((paid._count / total._count) * 100) : 0,
    recentInvoices: recentInvoices.map(i => ({
      number: i.invoiceNumber, amount: i.totalAmount, status: i.status,
      client: i.client.companyName, campaign: i.campaign.name,
    })),
  });
}

async function executeQueryAssets(input: any) {
  const where: any = {};
  if (input.city) where.city = input.city;
  if (input.type) where.type = input.type;
  if (input.status) where.status = input.status;

  const [assets, byStatus, byType, byCity] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { vendor: { select: { name: true } }, _count: { select: { bookings: true } } },
      orderBy: { monthlyRate: 'desc' },
      take: 50,
    }),
    prisma.asset.groupBy({ by: ['status'], where, _count: true }),
    prisma.asset.groupBy({ by: ['type'], where, _count: true }),
    prisma.asset.groupBy({ by: ['city'], where, _count: true }),
  ]);

  const totalAssets = assets.length;
  const available = byStatus.find(s => s.status === 'AVAILABLE')?._count || 0;
  const occupancyRate = totalAssets > 0 ? Math.round(((totalAssets - available) / totalAssets) * 100) : 0;

  return JSON.stringify({
    totalAssets,
    occupancyRate,
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
    byType: byType.map(t => ({ type: t.type, count: t._count })),
    byCity: byCity.map(c => ({ city: c.city, count: c._count })),
    topAssets: assets.slice(0, 10).map(a => ({
      name: a.name, code: a.code, type: a.type, city: a.city,
      monthlyRate: a.monthlyRate, status: a.status, bookings: a._count.bookings,
      vendor: a.vendor.name,
    })),
  });
}

async function executeQueryBookings(input: any) {
  const where: any = {};
  if (input.status) where.status = input.status;
  if (input.startDate) where.startDate = { gte: new Date(input.startDate) };
  if (input.endDate) where.endDate = { ...where.endDate, lte: new Date(input.endDate) };

  const [bookings, byStatus, totalRevenue, expiringHolds] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        campaign: { select: { name: true, client: { select: { companyName: true } } } },
        asset: { select: { name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.booking.groupBy({ by: ['status'], where, _count: true, _sum: { amount: true } }),
    prisma.booking.aggregate({ where, _sum: { amount: true } }),
    prisma.booking.findMany({
      where: {
        status: 'HOLD',
        holdExpiresAt: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      },
      include: { asset: { select: { name: true } }, campaign: { select: { name: true } } },
    }),
  ]);

  return JSON.stringify({
    totalBookings: bookings.length,
    totalRevenue: totalRevenue._sum.amount || 0,
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count, revenue: s._sum.amount || 0 })),
    expiringHoldsCount: expiringHolds.length,
    expiringHolds: expiringHolds.map(h => ({
      asset: h.asset.name, campaign: h.campaign.name, expiresAt: h.holdExpiresAt,
    })),
    recentBookings: bookings.slice(0, 10).map(b => ({
      asset: b.asset.name, city: b.asset.city, campaign: b.campaign.name,
      client: b.campaign.client.companyName, amount: b.amount, status: b.status,
    })),
  });
}

async function executeQueryEnquiries(input: any) {
  const where: any = {};
  if (input.status) where.status = input.status;
  if (input.assignedToId) where.assignedToId = input.assignedToId;

  const [enquiries, byStatus, byPriority, converted] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: { assignedTo: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.enquiry.groupBy({ by: ['status'], where, _count: true }),
    prisma.enquiry.groupBy({ by: ['priority'], where, _count: true }),
    prisma.enquiry.count({ where: { status: 'CONVERTED' } }),
  ]);

  const total = await prisma.enquiry.count({ where });
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return JSON.stringify({
    totalEnquiries: total,
    conversionRate,
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
    byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
    recentEnquiries: enquiries.slice(0, 10).map(e => ({
      company: e.companyName, contact: e.contactPerson, status: e.status,
      priority: e.priority, budget: e.budget, assignedTo: e.assignedTo?.name || 'Unassigned',
    })),
  });
}

async function executeQueryCampaigns(input: any) {
  const where: any = {};
  if (input.status) where.status = input.status;
  if (input.clientId) where.clientId = input.clientId;

  const [campaigns, byStatus] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
        _count: { select: { bookings: true, invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.campaign.groupBy({ by: ['status'], where, _count: true, _sum: { totalBudget: true } }),
  ]);

  return JSON.stringify({
    totalCampaigns: campaigns.length,
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count, totalBudget: s._sum.totalBudget || 0 })),
    campaigns: campaigns.map(c => ({
      name: c.name, client: c.client.companyName, status: c.status,
      budget: c.totalBudget, bookings: c._count.bookings, invoices: c._count.invoices,
      startDate: c.startDate, endDate: c.endDate,
    })),
  });
}

async function executeQueryClients(input: any) {
  const where: any = { isActive: true };
  if (input.industry) where.industry = input.industry;

  const clients = await prisma.client.findMany({
    where,
    include: {
      campaigns: { select: { totalBudget: true, status: true } },
      invoices: { select: { totalAmount: true, status: true } },
      _count: { select: { campaigns: true, enquiries: true } },
    },
  });

  const enriched = clients.map(c => {
    const totalSpend = c.invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0);
    const pendingAmount = c.invoices.filter(i => ['DRAFT', 'SENT', 'OVERDUE'].includes(i.status)).reduce((sum, i) => sum + i.totalAmount, 0);
    return {
      name: c.companyName, industry: c.industry, city: c.city,
      totalSpend, pendingAmount,
      campaignCount: c._count.campaigns,
      activeCampaigns: c.campaigns.filter(cam => ['LIVE', 'CREATIVE_APPROVED', 'CREATIVE_PENDING'].includes(cam.status)).length,
      enquiryCount: c._count.enquiries,
    };
  });

  if (input.sortBy === 'campaigns') enriched.sort((a, b) => b.campaignCount - a.campaignCount);
  else if (input.sortBy === 'recent') enriched.sort((a, b) => b.enquiryCount - a.enquiryCount);
  else enriched.sort((a, b) => b.totalSpend - a.totalSpend);

  return JSON.stringify({ totalClients: enriched.length, clients: enriched.slice(0, 20) });
}

async function executeComparePeriods(input: any) {
  const { metric, period1Start, period1End, period2Start, period2End } = input;
  let period1Value = 0, period2Value = 0, period1Count = 0, period2Count = 0;

  if (metric === 'revenue') {
    const [p1, p2] = await Promise.all([
      prisma.invoice.aggregate({ where: { status: 'PAID', paidAt: { gte: new Date(period1Start), lte: new Date(period1End) } }, _sum: { totalAmount: true }, _count: true }),
      prisma.invoice.aggregate({ where: { status: 'PAID', paidAt: { gte: new Date(period2Start), lte: new Date(period2End) } }, _sum: { totalAmount: true }, _count: true }),
    ]);
    period1Value = p1._sum.totalAmount || 0; period1Count = p1._count;
    period2Value = p2._sum.totalAmount || 0; period2Count = p2._count;
  } else if (metric === 'bookings') {
    const [p1, p2] = await Promise.all([
      prisma.booking.aggregate({ where: { createdAt: { gte: new Date(period1Start), lte: new Date(period1End) } }, _sum: { amount: true }, _count: true }),
      prisma.booking.aggregate({ where: { createdAt: { gte: new Date(period2Start), lte: new Date(period2End) } }, _sum: { amount: true }, _count: true }),
    ]);
    period1Value = p1._sum.amount || 0; period1Count = p1._count;
    period2Value = p2._sum.amount || 0; period2Count = p2._count;
  } else if (metric === 'enquiries') {
    const [p1, p2] = await Promise.all([
      prisma.enquiry.count({ where: { createdAt: { gte: new Date(period1Start), lte: new Date(period1End) } } }),
      prisma.enquiry.count({ where: { createdAt: { gte: new Date(period2Start), lte: new Date(period2End) } } }),
    ]);
    period1Count = p1; period2Count = p2;
    period1Value = p1; period2Value = p2;
  }

  const change = period1Value > 0 ? Math.round(((period2Value - period1Value) / period1Value) * 100) : 0;

  return JSON.stringify({
    metric,
    period1: { start: period1Start, end: period1End, value: period1Value, count: period1Count },
    period2: { start: period2Start, end: period2End, value: period2Value, count: period2Count },
    changePercent: change,
    trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'FLAT',
  });
}

async function executeGetAnomalies(input: any) {
  const lookback = input.lookbackDays || 30;
  const anomalies: any[] = [];

  // Check for overdue invoices
  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: 'OVERDUE' },
    include: { client: { select: { companyName: true } } },
  });
  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((s, i) => s + i.totalAmount, 0);
    anomalies.push({
      type: 'warning', area: 'revenue',
      title: `${overdueInvoices.length} overdue invoices totaling ₹${totalOverdue.toLocaleString()}`,
      details: overdueInvoices.map(i => `${i.invoiceNumber} - ${i.client.companyName}: ₹${i.totalAmount.toLocaleString()}`),
    });
  }

  // Check for expiring holds
  const expiringHolds = await prisma.booking.count({
    where: { status: 'HOLD', holdExpiresAt: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) } },
  });
  if (expiringHolds > 0) {
    anomalies.push({ type: 'warning', area: 'bookings', title: `${expiringHolds} holds expiring within 24 hours` });
  }

  // Check for unassigned enquiries
  const unassigned = await prisma.enquiry.count({ where: { status: 'NEW', assignedToId: null } });
  if (unassigned > 0) {
    anomalies.push({ type: 'opportunity', area: 'enquiries', title: `${unassigned} new enquiries not yet assigned` });
  }

  // Check asset utilization
  const [totalAssets, availableAssets] = await Promise.all([
    prisma.asset.count({ where: { status: { not: 'INACTIVE' } } }),
    prisma.asset.count({ where: { status: 'AVAILABLE' } }),
  ]);
  const occupancy = totalAssets > 0 ? Math.round(((totalAssets - availableAssets) / totalAssets) * 100) : 0;
  if (occupancy < 50) {
    anomalies.push({ type: 'warning', area: 'assets', title: `Low occupancy rate: ${occupancy}% — ${availableAssets} assets sitting idle` });
  } else if (occupancy > 90) {
    anomalies.push({ type: 'opportunity', area: 'assets', title: `High occupancy: ${occupancy}% — consider expanding inventory` });
  }

  // Check stale enquiries (NEW for > 3 days)
  const stale = await prisma.enquiry.count({
    where: { status: 'NEW', createdAt: { lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
  });
  if (stale > 0) {
    anomalies.push({ type: 'critical', area: 'enquiries', title: `${stale} enquiries untouched for 3+ days — leads going cold` });
  }

  // Check for pending creatives
  const pendingCreatives = await prisma.creative.count({ where: { status: 'PENDING' } });
  if (pendingCreatives > 3) {
    anomalies.push({ type: 'warning', area: 'creatives', title: `${pendingCreatives} creatives pending review — may delay campaigns` });
  }

  return JSON.stringify({ lookbackDays: lookback, anomalies, totalAnomalies: anomalies.length });
}

// Tool dispatcher
async function executeTool(name: string, input: any): Promise<string> {
  switch (name) {
    case 'query_revenue': return executeQueryRevenue(input);
    case 'query_assets': return executeQueryAssets(input);
    case 'query_bookings': return executeQueryBookings(input);
    case 'query_enquiries': return executeQueryEnquiries(input);
    case 'query_campaigns': return executeQueryCampaigns(input);
    case 'query_clients': return executeQueryClients(input);
    case 'compare_periods': return executeComparePeriods(input);
    case 'get_anomalies': return executeGetAnomalies(input);
    default: return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// Main agent chat function
export async function agentChat(
  userMessage: string,
  conversationHistory: Anthropic.MessageParam[] = [],
): Promise<{ response: string; toolsUsed: string[]; usage: { input: number; output: number } }> {
  if (!env.ANTHROPIC_API_KEY) {
    return { response: 'AI agent is not configured. Please set the ANTHROPIC_API_KEY environment variable.', toolsUsed: [], usage: { input: 0, output: 0 } };
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const toolsUsed: string[] = [];
  let totalInput = 0, totalOutput = 0;
  let maxIterations = 8;

  while (maxIterations-- > 0) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages,
    });

    totalInput += response.usage.input_tokens;
    totalOutput += response.usage.output_tokens;

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      return { response: textBlock?.text || 'No response generated.', toolsUsed, usage: { input: totalInput, output: totalOutput } };
    }

    // Handle tool calls
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    if (toolUseBlocks.length === 0) {
      const textBlock = response.content.find(b => b.type === 'text');
      return { response: textBlock?.text || 'No response generated.', toolsUsed, usage: { input: totalInput, output: totalOutput } };
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tool of toolUseBlocks) {
      toolsUsed.push(tool.name);
      try {
        const result = await executeTool(tool.name, tool.input);
        toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
      } catch (error: any) {
        toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: `Error: ${error.message}`, is_error: true });
      }
    }

    messages.push({ role: 'user', content: toolResults });
  }

  return { response: 'Agent reached maximum iterations. Please try a more specific question.', toolsUsed, usage: { input: totalInput, output: totalOutput } };
}

// Generate daily business insights
export async function generateDailyInsights(): Promise<any[]> {
  if (!env.ANTHROPIC_API_KEY) {
    console.log('AI agent not configured — skipping daily insights');
    return [];
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Gather current business snapshot
  const [
    revenueData,
    assetData,
    enquiryData,
    anomalyData,
  ] = await Promise.all([
    executeQueryRevenue({}),
    executeQueryAssets({}),
    executeQueryEnquiries({}),
    executeGetAnomalies({ lookbackDays: 7 }),
  ]);

  const snapshot = `Business Snapshot:
Revenue: ${revenueData}
Assets: ${assetData}
Enquiries: ${enquiryData}
Anomalies: ${anomalyData}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are a business intelligence analyst for an OOH advertising company. Analyze the business data and generate 3-5 actionable insights. Each insight should have: type (revenue/occupancy/enquiry/campaign/asset/forecast/anomaly), severity (info/warning/critical/opportunity), title (short), summary (2-3 sentences with specific numbers). Return ONLY valid JSON array of insights.`,
    messages: [{ role: 'user', content: snapshot }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) return [];

  try {
    const jsonStr = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const insights = JSON.parse(jsonStr);

    // Store insights in the database
    const created: any[] = [];
    for (const insight of insights) {
      const record = await prisma.aiInsight.create({
        data: {
          type: insight.type || 'info',
          title: insight.title,
          summary: insight.summary,
          severity: insight.severity || 'info',
          actionable: insight.actionable !== false,
          metadata: insight.metadata || null,
        },
      });
      created.push(record);
    }

    return created;
  } catch (e) {
    console.error('Failed to parse AI insights:', e);
    return [];
  }
}

// Log an AI decision for learning
export async function logAiDecision(data: {
  insightId?: string;
  action: string;
  input: any;
  output: any;
  confidence?: number;
}) {
  return prisma.aiDecisionLog.create({
    data: {
      insightId: data.insightId,
      action: data.action,
      input: data.input,
      output: data.output,
      confidence: data.confidence,
    },
  });
}
