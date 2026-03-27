import cron from 'node-cron';
import { runScrape } from '../scraper/index.js';

let isRunning = false;
let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the periodic scrape scheduler.
 * Runs every N hours (default: 6).
 */
export function startScheduler(intervalHours: number = 6): void {
  // Validate interval
  const hours = Math.max(1, Math.min(24, intervalHours));
  const cronExpression = `0 */${hours} * * *`;

  console.log(`[Scheduler] Starting scrape scheduler (every ${hours} hours, cron: ${cronExpression})`);

  scheduledTask = cron.schedule(cronExpression, async () => {
    if (isRunning) {
      console.log('[Scheduler] Scrape already in progress, skipping...');
      return;
    }

    isRunning = true;
    console.log(`[Scheduler] Scheduled scrape started at ${new Date().toISOString()}`);

    try {
      const result = await runScrape();
      console.log(`[Scheduler] Scrape completed: ${result.teamsUpserted} teams, ${result.playersUpserted} players in ${result.duration.toFixed(1)}s`);

      if (result.errors.length > 0) {
        console.warn(`[Scheduler] Scrape had ${result.errors.length} errors:`);
        result.errors.forEach((e) => console.warn(`  - ${e}`));
      }
    } catch (error) {
      console.error('[Scheduler] Scrape failed:', error instanceof Error ? error.message : error);
    } finally {
      isRunning = false;
    }
  });

  console.log('[Scheduler] Scheduler started successfully');
}

/**
 * Stop the scheduler.
 */
export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Scheduler] Scheduler stopped');
  }
}

/**
 * Run an immediate scrape (manual trigger).
 */
export async function triggerScrape(): Promise<{ success: boolean; message: string }> {
  if (isRunning) {
    return { success: false, message: 'Scrape already in progress' };
  }

  isRunning = true;
  try {
    const result = await runScrape();
    return {
      success: result.success,
      message: `Scraped ${result.teamsUpserted} teams and ${result.playersUpserted} players in ${result.duration.toFixed(1)}s` +
        (result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''),
    };
  } finally {
    isRunning = false;
  }
}
