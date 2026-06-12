import { MarketingService } from '@/services/marketing/marketing.service';
import { logger } from '@/utils/logger';

// Marketing automation worker: runs every owner's enabled automations on an
// interval. Idempotency is handled by MarketingService (MarketingLog dedupe +
// lastRunAt), so a generous interval is safe and avoids spamming customers.
export function startMarketingWorker() {
  const intervalMs = 12 * 60 * 60 * 1000; // every 12 hours

  const run = async () => {
    try {
      const result = await MarketingService.runAll();
      logger.info('📣 Marketing worker iteration complete', result);
    } catch (error) {
      logger.warn('marketingWorker iteration failed', { error: (error as Error)?.message });
    }
  };

  // Delay the first run a little so it doesn't compete with boot work.
  setTimeout(run, 60 * 1000);
  setInterval(run, intervalMs);
}
