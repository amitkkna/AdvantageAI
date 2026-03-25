import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database';
import { chatMessageSchema } from '@advantage/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';
import { SCORE_WEIGHTS } from '@advantage/shared';

const router = Router();

// ─── Guided Options per Stage/Step ────────────────────

interface ChatOption {
  id: string;
  label: string;
  icon?: string;
}

interface StageStep {
  question: string;
  key: string;
  type: 'single' | 'multi' | 'text';
  options?: ChatOption[];
  placeholder?: string;
}

const STAGE_STEPS: Record<number, StageStep[]> = {
  1: [
    {
      question: 'What industry is your brand in?',
      key: 'industry',
      type: 'single',
      options: [
        { id: 'fmcg', label: 'FMCG / Consumer Goods', icon: '🛒' },
        { id: 'real_estate', label: 'Real Estate', icon: '🏗️' },
        { id: 'automotive', label: 'Automotive', icon: '🚗' },
        { id: 'restaurant', label: 'Restaurant / Food', icon: '🍽️' },
        { id: 'education', label: 'Education', icon: '🎓' },
        { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
        { id: 'retail', label: 'Retail / Shopping', icon: '🛍️' },
        { id: 'technology', label: 'Technology', icon: '💻' },
        { id: 'banking', label: 'Banking / Finance', icon: '🏦' },
        { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
      ],
    },
    {
      question: 'What is your brand/company name?',
      key: 'brand',
      type: 'text',
      placeholder: 'Enter your brand name...',
    },
    {
      question: 'Who is your target audience?',
      key: 'targetAudience',
      type: 'multi',
      options: [
        { id: 'youth', label: '18-25 Youth', icon: '🧑' },
        { id: 'young_professionals', label: '25-35 Professionals', icon: '💼' },
        { id: 'business_owners', label: '35-50 Business Owners', icon: '👔' },
        { id: 'families', label: 'Families', icon: '👨‍👩‍👧‍👦' },
        { id: 'seniors', label: '50+ Seniors', icon: '👴' },
        { id: 'women', label: 'Women', icon: '👩' },
        { id: 'students', label: 'Students', icon: '📚' },
        { id: 'all_ages', label: 'All Ages / Mass Market', icon: '🌍' },
      ],
    },
    {
      question: 'What is your campaign objective?',
      key: 'objectives',
      type: 'single',
      options: [
        { id: 'brand_awareness', label: 'Brand Awareness', icon: '📢' },
        { id: 'product_launch', label: 'New Product Launch', icon: '🚀' },
        { id: 'store_opening', label: 'Store / Office Opening', icon: '🏪' },
        { id: 'seasonal_promo', label: 'Seasonal Promotion', icon: '🎉' },
        { id: 'event_promo', label: 'Event Promotion', icon: '🎪' },
        { id: 'lead_gen', label: 'Lead Generation', icon: '📋' },
        { id: 'rebranding', label: 'Rebranding', icon: '✨' },
      ],
    },
    {
      question: 'Any specific messaging or tagline for the campaign? (optional)',
      key: 'messaging',
      type: 'text',
      placeholder: 'E.g., "Fresh taste, fresh life" or leave blank',
    },
  ],
  2: [
    {
      question: 'Which cities do you want to target?',
      key: 'cities',
      type: 'multi',
      options: [
        { id: 'Raipur', label: 'Raipur', icon: '📍' },
        { id: 'Bhilai', label: 'Bhilai', icon: '📍' },
        { id: 'Durg', label: 'Durg', icon: '📍' },
        { id: 'Bilaspur', label: 'Bilaspur', icon: '📍' },
      ],
    },
    {
      question: 'Any preferred areas or landmarks?',
      key: 'areas',
      type: 'multi',
      options: [
        { id: 'main_road', label: 'Main Road / MG Road', icon: '🛣️' },
        { id: 'vip_road', label: 'VIP Road', icon: '🛣️' },
        { id: 'station_road', label: 'Station Road / Railway', icon: '🚉' },
        { id: 'telibandha', label: 'Telibandha / Marine Drive', icon: '🌊' },
        { id: 'pandri', label: 'Pandri Market Area', icon: '🏬' },
        { id: 'shankar_nagar', label: 'Shankar Nagar', icon: '🏘️' },
        { id: 'highway', label: 'National Highway / NH', icon: '🛤️' },
        { id: 'bus_stands', label: 'Bus Stands / Transit', icon: '🚌' },
      ],
    },
    {
      question: 'What kind of coverage do you prefer?',
      key: 'coverage',
      type: 'single',
      options: [
        { id: 'concentrated', label: 'Concentrated (few key spots)', icon: '🎯' },
        { id: 'citywide', label: 'Citywide Spread', icon: '🗺️' },
        { id: 'highway', label: 'Highway / Intercity', icon: '🛣️' },
        { id: 'mixed', label: 'Mix of All', icon: '🔄' },
      ],
    },
  ],
  3: [
    {
      question: 'What is your total campaign budget?',
      key: 'budget',
      type: 'single',
      options: [
        { id: '100000', label: '₹1 - 3 Lakhs', icon: '💰' },
        { id: '300000', label: '₹3 - 5 Lakhs', icon: '💰' },
        { id: '500000', label: '₹5 - 10 Lakhs', icon: '💰💰' },
        { id: '1000000', label: '₹10 - 20 Lakhs', icon: '💰💰💰' },
        { id: '2000000', label: '₹20 Lakhs+', icon: '💰💰💰💰' },
      ],
    },
    {
      question: 'How long should the campaign run?',
      key: 'duration',
      type: 'single',
      options: [
        { id: '1_month', label: '1 Month', icon: '📅' },
        { id: '3_months', label: '3 Months', icon: '📅' },
        { id: '6_months', label: '6 Months', icon: '📅' },
        { id: '12_months', label: '12 Months', icon: '📅' },
      ],
    },
    {
      question: 'When do you want to start?',
      key: 'startDate',
      type: 'single',
      options: [
        { id: 'this_month', label: 'This Month', icon: '⚡' },
        { id: 'next_month', label: 'Next Month', icon: '📆' },
        { id: '2_3_months', label: 'In 2-3 Months', icon: '🗓️' },
        { id: 'flexible', label: 'Flexible', icon: '🤷' },
      ],
    },
    {
      question: 'How should the budget be distributed?',
      key: 'distribution',
      type: 'single',
      options: [
        { id: 'equal', label: 'Equal Across All Sites', icon: '⚖️' },
        { id: 'traffic_weighted', label: 'More on High-Traffic Spots', icon: '📊' },
        { id: 'prime_heavy', label: 'Focus on Prime Locations', icon: '⭐' },
        { id: 'ai_recommend', label: 'Let AI Recommend', icon: '🤖' },
      ],
    },
  ],
  4: [], // Dynamic — filled with matched assets
  5: [], // Dynamic — proposal confirmation
};

function scoreAsset(
  asset: any,
  criteria: { cities?: string[]; budget?: number; startDate?: string; duration?: string }
): { totalScore: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const cityMatch = criteria.cities?.some((c: string) =>
    asset.city.toLowerCase().includes(c.toLowerCase())
  );
  breakdown.locationRelevance = cityMatch ? SCORE_WEIGHTS.LOCATION_RELEVANCE : 5;

  if (criteria.budget) {
    const monthlyBudgetPerAsset = criteria.budget / 5;
    const ratio = asset.monthlyRate / monthlyBudgetPerAsset;
    breakdown.budgetFit = ratio <= 1 ? SCORE_WEIGHTS.BUDGET_FIT : Math.max(0, SCORE_WEIGHTS.BUDGET_FIT - (ratio - 1) * 20);
  } else {
    breakdown.budgetFit = 10;
  }

  breakdown.trafficVolume = asset.trafficCount
    ? Math.min(SCORE_WEIGHTS.TRAFFIC_VOLUME, (asset.trafficCount / 100000) * SCORE_WEIGHTS.TRAFFIC_VOLUME)
    : 8;

  const area = (asset.width || 10) * (asset.height || 10);
  breakdown.sizeAppropriateness = area >= 100 ? SCORE_WEIGHTS.SIZE_APPROPRIATENESS : Math.round((area / 100) * SCORE_WEIGHTS.SIZE_APPROPRIATENESS);

  breakdown.availabilityMatch = asset.status === 'AVAILABLE' ? SCORE_WEIGHTS.AVAILABILITY_MATCH : asset.status === 'PARTIALLY_BOOKED' ? 8 : 0;

  breakdown.vendorReliability = asset.vendor?.reliabilityScore
    ? Math.round((asset.vendor.reliabilityScore / 100) * SCORE_WEIGHTS.VENDOR_RELIABILITY)
    : 5;

  const totalScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { totalScore: Math.round(totalScore), breakdown };
}

async function getMatchedAssets(stageData: any) {
  const where: any = { status: { in: ['AVAILABLE', 'PARTIALLY_BOOKED'] } };
  if (stageData.cities?.length) {
    where.city = { in: stageData.cities };
  }

  const assets = await prisma.asset.findMany({
    where,
    include: { vendor: { select: { name: true, reliabilityScore: true } } },
    take: 20,
  });

  return assets
    .map((a) => ({
      id: a.id,
      name: a.name,
      code: a.code,
      type: a.type,
      city: a.city,
      address: a.address,
      width: a.width,
      height: a.height,
      monthlyRate: a.monthlyRate,
      trafficCount: a.trafficCount,
      lighting: a.lighting,
      status: a.status,
      vendor: a.vendor?.name,
      ...scoreAsset(a, stageData),
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

async function createProposalFromSession(session: any) {
  const stageData = session.stageData as any;
  const clientId = session.clientId;
  if (!clientId) return null;

  let assetIds = stageData.selectedAssets || [];
  let proposalAssets: any[] = [];

  if (assetIds.length > 0) {
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      include: { vendor: { select: { name: true } } },
    });
    proposalAssets = assets.map((a) => ({
      assetId: a.id, name: a.name, code: a.code, type: a.type,
      city: a.city, address: a.address, monthlyRate: a.monthlyRate,
      width: a.width, height: a.height, vendor: a.vendor?.name,
    }));
  } else {
    const scored = await getMatchedAssets(stageData);
    proposalAssets = scored.slice(0, 5).map((a) => ({
      assetId: a.id, name: a.name, code: a.code, type: a.type,
      city: a.city, address: a.address, monthlyRate: a.monthlyRate,
      width: a.width, height: a.height, vendor: a.vendor,
      score: a.totalScore,
    }));
  }

  const totalBudget = stageData.budget
    ? parseInt(stageData.budget)
    : proposalAssets.reduce((s: number, a: any) => s + (a.monthlyRate || 0), 0) * 3;

  return prisma.proposal.create({
    data: {
      clientId,
      title: `Campaign Proposal — ${stageData.brand || 'OOH Campaign'}`,
      description: `AI-generated proposal for ${stageData.brand || 'client'}. Industry: ${stageData.industry || 'N/A'}. Objectives: ${stageData.objectives || 'brand awareness'}. Target: ${Array.isArray(stageData.targetAudience) ? stageData.targetAudience.join(', ') : stageData.targetAudience || 'general'}. Duration: ${stageData.duration || '3 months'}. Cities: ${Array.isArray(stageData.cities) ? stageData.cities.join(', ') : 'N/A'}.`,
      totalBudget,
      assets: proposalAssets,
      chatSessionId: session.id,
      status: 'DRAFT',
    },
  });
}

function generateProposalSummary(stageData: any, assets: any[]) {
  const budget = stageData.budget ? parseInt(stageData.budget) : 0;
  const budgetLabel = budget >= 2000000 ? '₹20L+' : `₹${(budget / 100000).toFixed(0)}L`;
  const totalMonthly = assets.reduce((s: number, a: any) => s + (a.monthlyRate || 0), 0);
  const totalImpressions = assets.reduce((s: number, a: any) => s + (a.trafficCount || 50000), 0);

  let summary = `📋 **Campaign Proposal Summary**\n\n`;
  summary += `**Brand:** ${stageData.brand || 'N/A'}\n`;
  summary += `**Industry:** ${stageData.industry || 'N/A'}\n`;
  summary += `**Objective:** ${stageData.objectives || 'N/A'}\n`;
  summary += `**Target Audience:** ${Array.isArray(stageData.targetAudience) ? stageData.targetAudience.join(', ') : stageData.targetAudience || 'N/A'}\n`;
  summary += `**Cities:** ${Array.isArray(stageData.cities) ? stageData.cities.join(', ') : 'N/A'}\n`;
  summary += `**Duration:** ${stageData.duration || 'N/A'}\n`;
  summary += `**Budget:** ${budgetLabel}\n\n`;
  summary += `📍 **Selected Locations (${assets.length}):**\n`;

  assets.forEach((a, i) => {
    summary += `${i + 1}. **${a.name}** (${a.code}) — ${a.city}\n`;
    summary += `   ${a.type?.replace(/_/g, ' ')} | ${a.width}x${a.height}ft | ₹${(a.monthlyRate || 0).toLocaleString()}/mo | Score: ${a.totalScore}/100\n`;
  });

  summary += `\n💰 **Cost Summary:**\n`;
  summary += `Total Monthly: ₹${totalMonthly.toLocaleString()}\n`;
  summary += `Est. Daily Impressions: ${totalImpressions.toLocaleString()}\n`;
  summary += `\nWould you like to **finalize** this proposal or make changes?`;

  return summary;
}

// ─── POST /api/chat/message ───────────────────────────
router.post('/message', authenticate, validate(chatMessageSchema), async (req: Request, res: Response) => {
  try {
    const { sessionId, message, selections, clientId } = req.body;
    let session: any;

    if (sessionId) {
      session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
      if (!session) { sendError(res, 'Session not found', 404); return; }
    } else {
      let resolvedClientId = clientId || req.user!.clientId;
      if (!resolvedClientId) {
        const firstClient = await prisma.client.findFirst();
        resolvedClientId = firstClient?.id || null;
      }

      session = await prisma.chatSession.create({
        data: {
          userId: req.user!.userId,
          clientId: resolvedClientId,
          stage: 1,
          stageData: {},
          messages: [],
        },
      });
    }

    const chatMessages = (session.messages as any[]) || [];
    const stageData: any = { ...(session.stageData as Record<string, unknown>) };
    let currentStage = session.stage as number;
    let currentStep = (stageData._currentStep as number) || 0;
    const steps = STAGE_STEPS[currentStage] || [];

    // ── Handle selection-based input ──
    if (selections && typeof selections === 'object') {
      // Merge all selections into stageData
      for (const [key, value] of Object.entries(selections)) {
        stageData[key] = value;
      }

      // Record the user message
      const selectionSummary = Object.entries(selections)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
      const userMsg = message ? `${selectionSummary} — ${message}` : selectionSummary;
      chatMessages.push({ role: 'user', content: userMsg, timestamp: new Date().toISOString() });

      // ── Handle proposal finalize action ──
      if (selections.proposalAction === 'finalize') {
        let proposal: any = null;
        try {
          proposal = await createProposalFromSession(session);
        } catch (e) {
          console.error('Proposal creation error:', e);
        }

        const responseText = proposal
          ? `🎉 **Your campaign proposal has been created!**\n\n**Title:** ${proposal.title}\n**Total Budget:** ₹${proposal.totalBudget.toLocaleString()}\n\nYou can view and manage it from the **Proposals** section.`
          : `🎉 **Campaign planning complete!** Your proposal data has been saved.`;

        chatMessages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });

        await prisma.chatSession.update({
          where: { id: session.id },
          data: { stage: 5, stageData, messages: chatMessages, isComplete: true },
        });

        sendSuccess(res, {
          sessionId: session.id,
          message: responseText,
          stage: 5,
          isComplete: true,
          proposalId: proposal?.id,
        });
        return;
      }

      // ── Handle modify / restart actions ──
      if (selections.proposalAction === 'restart') {
        const responseText = `🔄 **Starting over!** Let's plan a new campaign.`;
        const firstStep = STAGE_STEPS[1][0];
        chatMessages.push({ role: 'assistant', content: responseText + '\n\n' + firstStep.question, timestamp: new Date().toISOString() });

        await prisma.chatSession.update({
          where: { id: session.id },
          data: { stage: 1, stageData: { _currentStep: 0 }, messages: chatMessages, isComplete: false },
        });

        sendSuccess(res, {
          sessionId: session.id,
          message: responseText + '\n\n' + firstStep.question,
          stage: 1,
          step: 0,
          totalSteps: STAGE_STEPS[1].length,
          options: firstStep,
          isComplete: false,
        });
        return;
      }

      if (selections.proposalAction === 'modify') {
        const matchedAssets = await getMatchedAssets(stageData);
        const topAssets = matchedAssets.slice(0, 8);
        const responseText = `✏️ **Let's adjust your selections.** Pick the billboards you want:`;

        chatMessages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });

        await prisma.chatSession.update({
          where: { id: session.id },
          data: { stage: 4, stageData: { ...stageData, _currentStep: 0 }, messages: chatMessages },
        });

        sendSuccess(res, {
          sessionId: session.id,
          message: responseText,
          stage: 4,
          step: 0,
          totalSteps: 1,
          options: {
            question: 'Select billboards for your campaign:',
            key: 'selectedAssets',
            type: 'multi',
            options: topAssets.map((a) => ({
              id: a.id,
              label: `${a.name} — ${a.city} — ₹${(a.monthlyRate || 0).toLocaleString()}/mo (Score: ${a.totalScore})`,
              icon: a.type === 'DIGITAL_SCREEN' ? '📺' : a.type === 'BUS_SHELTER' ? '🚌' : '📋',
            })),
          },
          isComplete: false,
        });
        return;
      }

      // Advance step
      currentStep++;

      // Check if all steps in current stage are done
      if (currentStep >= steps.length) {
        // Stage complete — advance to next stage
        currentStep = 0;
        const prevStage = currentStage;
        currentStage = Math.min(currentStage + 1, 5);

        stageData._currentStep = 0;

        // Generate response based on what stage we're entering
        let responseText = '';
        let responseOptions: any = null;
        let matchedAssets: any[] = [];

        if (currentStage === 4) {
          // Enter asset matching — fetch and score assets
          matchedAssets = await getMatchedAssets(stageData);
          const topAssets = matchedAssets.slice(0, 8);

          responseText = `✅ **Budget & Timeline confirmed!**\n\nBased on your criteria, here are the best matching billboards:\n\n`;
          topAssets.forEach((a, i) => {
            responseText += `**${i + 1}. ${a.name}** (${a.code})\n`;
            responseText += `   📍 ${a.city} — ${a.address || 'N/A'}\n`;
            responseText += `   📐 ${a.type?.replace(/_/g, ' ')} | ${a.width}x${a.height}ft\n`;
            responseText += `   💰 ₹${(a.monthlyRate || 0).toLocaleString()}/month\n`;
            responseText += `   ⭐ Score: ${a.totalScore}/100\n\n`;
          });

          const totalMonthly = topAssets.reduce((s, a) => s + (a.monthlyRate || 0), 0);
          responseText += `**Total Monthly Cost: ₹${totalMonthly.toLocaleString()}**\n\nSelect the billboards you want to include:`;

          responseOptions = {
            question: 'Select billboards for your campaign:',
            key: 'selectedAssets',
            type: 'multi',
            options: topAssets.map((a) => ({
              id: a.id,
              label: `${a.name} — ${a.city} — ₹${(a.monthlyRate || 0).toLocaleString()}/mo (Score: ${a.totalScore})`,
              icon: a.type === 'DIGITAL_SCREEN' ? '📺' : a.type === 'BUS_SHELTER' ? '🚌' : '📋',
            })),
          };
        } else if (currentStage === 5) {
          // Enter proposal stage
          matchedAssets = await getMatchedAssets(stageData);
          const selectedIds = stageData.selectedAssets as string[] || [];
          const selectedAssets = selectedIds.length > 0
            ? matchedAssets.filter((a) => selectedIds.includes(a.id))
            : matchedAssets.slice(0, 5);

          responseText = generateProposalSummary(stageData, selectedAssets);
          responseOptions = {
            question: 'What would you like to do?',
            key: 'proposalAction',
            type: 'single',
            options: [
              { id: 'finalize', label: 'Finalize Proposal', icon: '✅' },
              { id: 'modify', label: 'Modify Selections', icon: '✏️' },
              { id: 'restart', label: 'Start Over', icon: '🔄' },
            ],
          };
        } else {
          // Normal stage transition (1→2, 2→3)
          const stageNames: Record<number, string> = { 2: 'Location Preferences', 3: 'Budget & Timeline' };
          responseText = `✅ **Stage ${prevStage} complete!** Now let's talk about **${stageNames[currentStage] || 'next step'}**.`;
          const nextSteps = STAGE_STEPS[currentStage] || [];
          if (nextSteps.length > 0) {
            responseOptions = nextSteps[0];
          }
        }

        chatMessages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });

        await prisma.chatSession.update({
          where: { id: session.id },
          data: { stage: currentStage, stageData: { ...stageData, _currentStep: 0 }, messages: chatMessages },
        });

        sendSuccess(res, {
          sessionId: session.id,
          message: responseText,
          stage: currentStage,
          step: 0,
          totalSteps: (STAGE_STEPS[currentStage] || []).length,
          options: responseOptions,
          isComplete: false,
        });
        return;
      }

      // More steps in current stage — send next step options
      const nextStep = steps[currentStep];
      const responseText = `Got it! ${nextStep.question}`;
      chatMessages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });

      stageData._currentStep = currentStep;
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { stageData, messages: chatMessages },
      });

      sendSuccess(res, {
        sessionId: session.id,
        message: responseText,
        stage: currentStage,
        step: currentStep,
        totalSteps: steps.length,
        options: nextStep,
        isComplete: false,
      });
      return;
    }

    // ── Handle text-only messages (for stage 4 approval, stage 5 finalize, free text) ──
    chatMessages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Stage 5 finalize check
    if (currentStage === 5 || (stageData.proposalAction === 'finalize')) {
      let proposal: any = null;
      try {
        proposal = await createProposalFromSession(session);
      } catch (e) {
        console.error('Proposal creation error:', e);
      }

      const responseText = proposal
        ? `🎉 **Your campaign proposal has been created!**\n\nProposal: "${proposal.title}"\nTotal Budget: ₹${proposal.totalBudget.toLocaleString()}\n\nYou can view and manage it from the Proposals section.`
        : `🎉 **Campaign planning complete!** Your proposal data has been saved.`;

      chatMessages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });

      await prisma.chatSession.update({
        where: { id: session.id },
        data: { stage: 5, stageData, messages: chatMessages, isComplete: true },
      });

      sendSuccess(res, {
        sessionId: session.id,
        message: responseText,
        stage: 5,
        isComplete: true,
        proposalId: proposal?.id,
      });
      return;
    }

    // For first message — start stage 1
    if (chatMessages.length <= 1 && currentStage === 1 && currentStep === 0) {
      const firstStep = steps[0];
      const responseText = `Welcome! Let's plan your OOH campaign. I'll guide you through a few quick questions.\n\n${firstStep.question}`;
      chatMessages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });

      await prisma.chatSession.update({
        where: { id: session.id },
        data: { stageData: { ...stageData, _currentStep: 0 }, messages: chatMessages },
      });

      sendSuccess(res, {
        sessionId: session.id,
        message: responseText,
        stage: 1,
        step: 0,
        totalSteps: steps.length,
        options: firstStep,
        isComplete: false,
      });
      return;
    }

    // Fallback: use Claude for free-form conversation
    if (env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: `You are an OOH advertising campaign planner assistant. Answer helpfully and concisely. Current stage data: ${JSON.stringify(stageData)}`,
          messages: chatMessages.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
        });

        const assistantMsg = response.content[0].type === 'text' ? response.content[0].text : 'I can help with that!';
        chatMessages.push({ role: 'assistant', content: assistantMsg, timestamp: new Date().toISOString() });

        await prisma.chatSession.update({
          where: { id: session.id },
          data: { messages: chatMessages },
        });

        // Re-show current step options
        const currentStepData = steps[currentStep];
        sendSuccess(res, {
          sessionId: session.id,
          message: assistantMsg,
          stage: currentStage,
          step: currentStep,
          totalSteps: steps.length,
          options: currentStepData || null,
          isComplete: false,
        });
        return;
      } catch (e) {
        console.error('Claude fallback error:', e);
      }
    }

    // Final fallback
    const currentStepData = steps[currentStep];
    const responseText = `Please select from the options below to continue. ${currentStepData?.question || ''}`;
    chatMessages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });

    await prisma.chatSession.update({
      where: { id: session.id },
      data: { messages: chatMessages },
    });

    sendSuccess(res, {
      sessionId: session.id,
      message: responseText,
      stage: currentStage,
      step: currentStep,
      totalSteps: steps.length,
      options: currentStepData || null,
      isComplete: false,
    });
  } catch (error: any) {
    console.error('Chat error:', error?.message || error);
    sendError(res, error?.message || 'Failed to process chat message');
  }
});

// GET /api/chat/sessions
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user!.userId },
      select: { id: true, stage: true, isComplete: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, sessions);
  } catch (error) {
    sendError(res, 'Failed to fetch sessions');
  }
});

// GET /api/chat/sessions/:id
router.get('/sessions/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const session = await prisma.chatSession.findUnique({ where: { id: req.params.id } });
    if (!session) { sendError(res, 'Session not found', 404); return; }
    sendSuccess(res, session);
  } catch (error) {
    sendError(res, 'Failed to fetch session');
  }
});

export default router;
