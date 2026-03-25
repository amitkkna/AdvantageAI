import cron from 'node-cron';
import { generateDailyInsights } from '../services/aiAgent';

// Run daily at 6:00 AM IST (0:30 UTC)
export function startAiInsightsCron() {
  cron.schedule('30 0 * * *', async () => {
    console.log('[CRON] Generating daily AI insights...');
    try {
      const insights = await generateDailyInsights();
      console.log(`[CRON] Generated ${insights.length} AI insights`);
    } catch (error) {
      console.error('[CRON] AI insights generation failed:', error);
    }
  });
  console.log('AI Insights cron scheduled (daily at 6:00 AM IST)');
}
