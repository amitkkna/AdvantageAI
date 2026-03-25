import { prisma } from '../config/database';
import { ASSET_SCORE_WEIGHTS, CONDITION_SCORES, LIGHTING_SCORES } from '@advantage/shared';

export interface ScoreBreakdown {
  trafficVolume: number;
  physicalCondition: number;
  sizeVisibility: number;
  campaignPerformance: number;
  vendorReliability: number;
  lightingQuality: number;
  availability: number;
  total: number;
}

export async function calculateAssetScore(assetId: string): Promise<ScoreBreakdown> {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      vendor: { select: { reliabilityScore: true } },
      fieldCheckins: { orderBy: { createdAt: 'desc' }, take: 3 },
      bookings: {
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        select: { id: true },
      },
    },
  });

  if (!asset) throw new Error('Asset not found');

  const breakdown: ScoreBreakdown = {
    trafficVolume: 0,
    physicalCondition: 0,
    sizeVisibility: 0,
    campaignPerformance: 0,
    vendorReliability: 0,
    lightingQuality: 0,
    availability: 0,
    total: 0,
  };

  // 1. Traffic Volume (20 pts) — proportional, 100k daily = full score
  const maxTraffic = 100000;
  breakdown.trafficVolume = asset.trafficCount
    ? Math.min(ASSET_SCORE_WEIGHTS.TRAFFIC_VOLUME, Math.round((asset.trafficCount / maxTraffic) * ASSET_SCORE_WEIGHTS.TRAFFIC_VOLUME))
    : 8; // default if unknown

  // 2. Physical Condition (20 pts) — from latest field check-ins (weighted average of last 3)
  if (asset.fieldCheckins.length > 0) {
    const weights = [0.6, 0.25, 0.15]; // most recent weighs most
    let weightedScore = 0;
    let totalWeight = 0;
    asset.fieldCheckins.forEach((checkin: any, i: number) => {
      const w = weights[i] || 0.1;
      const condScore = CONDITION_SCORES[checkin.condition] ?? 10;
      weightedScore += condScore * w;
      totalWeight += w;
    });
    breakdown.physicalCondition = Math.round(weightedScore / totalWeight);
  } else {
    breakdown.physicalCondition = 12; // no inspection = moderate default
  }

  // 3. Size & Visibility (15 pts) — based on area and face count
  const area = (asset.width || 10) * (asset.height || 10);
  const areaScore = Math.min(12, Math.round((area / 500) * 12)); // 500 sq ft = full area score
  const faceBonus = Math.min(3, (asset.faces || 1) - 1 + 1); // extra faces add up to 3 pts
  breakdown.sizeVisibility = Math.min(ASSET_SCORE_WEIGHTS.SIZE_VISIBILITY, areaScore + faceBonus);

  // 4. Campaign Performance (15 pts) — avg impressions from analytics data
  const bookingIds = asset.bookings.map((b: any) => b.id);
  if (bookingIds.length > 0) {
    const analytics = await prisma.campaignAnalytics.aggregate({
      where: { bookingId: { in: bookingIds } },
      _avg: { impressions: true, reach: true },
      _count: true,
    });
    if (analytics._count > 0 && analytics._avg.impressions) {
      // 10k avg impressions = full score
      const impScore = Math.min(10, Math.round((analytics._avg.impressions / 10000) * 10));
      const reachScore = analytics._avg.reach
        ? Math.min(5, Math.round((analytics._avg.reach / 5000) * 5))
        : 2;
      breakdown.campaignPerformance = Math.min(ASSET_SCORE_WEIGHTS.CAMPAIGN_PERFORMANCE, impScore + reachScore);
    } else {
      breakdown.campaignPerformance = 7; // has bookings but no analytics
    }
  } else {
    breakdown.campaignPerformance = 5; // never booked = low but not zero
  }

  // 5. Vendor Reliability (10 pts) — proportional to vendor score
  breakdown.vendorReliability = asset.vendor?.reliabilityScore
    ? Math.round((asset.vendor.reliabilityScore / 100) * ASSET_SCORE_WEIGHTS.VENDOR_RELIABILITY)
    : 5;

  // 6. Lighting Quality (10 pts)
  breakdown.lightingQuality = LIGHTING_SCORES[asset.lighting] ?? 5;

  // 7. Availability (10 pts)
  switch (asset.status) {
    case 'AVAILABLE': breakdown.availability = 10; break;
    case 'PARTIALLY_BOOKED': breakdown.availability = 7; break;
    case 'FULLY_BOOKED': breakdown.availability = 3; break;
    case 'MAINTENANCE': breakdown.availability = 1; break;
    default: breakdown.availability = 0;
  }

  breakdown.total = breakdown.trafficVolume + breakdown.physicalCondition +
    breakdown.sizeVisibility + breakdown.campaignPerformance +
    breakdown.vendorReliability + breakdown.lightingQuality + breakdown.availability;

  return breakdown;
}

export async function recalculateAllScores(): Promise<number> {
  const assets = await prisma.asset.findMany({
    where: { status: { not: 'INACTIVE' } },
    select: { id: true },
  });

  let updated = 0;
  for (const asset of assets) {
    try {
      const breakdown = await calculateAssetScore(asset.id);
      await prisma.asset.update({
        where: { id: asset.id },
        data: { score: breakdown.total, scoreBreakdown: breakdown as any },
      });
      updated++;
    } catch {
      // skip failed assets
    }
  }
  return updated;
}
