import { prisma } from '../src/config/database';
import { recalculateAllScores } from '../src/utils/assetScoring';

async function main() {
  console.log('Recalculating asset scores...');
  const count = await recalculateAllScores();
  console.log(`Done! Scores recalculated for ${count} assets.`);

  const samples = await prisma.asset.findMany({
    where: { score: { not: null } },
    take: 5,
    orderBy: { score: 'desc' },
    select: { code: true, name: true, score: true, scoreBreakdown: true },
  });
  console.log('\nTop 5 scored assets:');
  for (const s of samples) {
    console.log(`  ${s.code} — ${s.name}: ${s.score}/100`);
    const bd = s.scoreBreakdown as any;
    if (bd) {
      console.log(`    Traffic:${bd.trafficVolume} Condition:${bd.physicalCondition} Size:${bd.sizeVisibility} Performance:${bd.campaignPerformance} Vendor:${bd.vendorReliability} Light:${bd.lightingQuality} Avail:${bd.availability}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
