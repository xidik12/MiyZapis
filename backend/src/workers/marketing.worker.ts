import cron from 'node-cron';
import { MarketingService } from '@/services/marketing/marketing.service';
import { logger } from '@/utils/logger';

// Marketing automation worker: runs every owner's enabled automations once a day
// at a sensible local hour (09:00 Kyiv) — so birthday greetings, win-back and
// rebooking nudges go out in the morning, not the middle of the night.
// Idempotency is handled by MarketingService (MarketingLog dedupe + lastRunAt),
// so the boot catch-up below can't double-send.
export function startMarketingWorker() {
  const run = async () => {
    try {
      const result = await MarketingService.runAll();
      logger.info('📣 Marketing worker run complete', result);
    } catch (error) {
      logger.warn('marketingWorker run failed', { error: (error as Error)?.message });
    }
  };

  // Daily at 09:00 Europe/Kyiv.
  cron.schedule('0 9 * * *', run, { timezone: 'Europe/Kyiv' });

  // Catch-up shortly after boot so a restart doesn't skip the day's run
  // (dedupe makes this safe even if the daily run already happened).
  setTimeout(run, 60 * 1000);
}
