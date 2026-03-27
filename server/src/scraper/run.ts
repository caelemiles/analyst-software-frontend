/**
 * Standalone scraper runner.
 * Usage: npx tsx src/scraper/run.ts
 */
import { initDatabase, closePool } from '../db/connection.js';
import { runScrape, CURRENT_SEASON, LEAGUE_NAME } from './index.js';

async function main() {
  console.log(`[Runner] Starting scrape for ${LEAGUE_NAME} season ${CURRENT_SEASON}...`);
  console.log(`[Runner] Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT configured'}`);

  try {
    await initDatabase();
    const result = await runScrape();

    console.log('\n=== Scrape Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Teams upserted: ${result.teamsUpserted}`);
    console.log(`Players upserted: ${result.playersUpserted}`);
    console.log(`Duration: ${result.duration.toFixed(1)}s`);

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`);
      result.errors.forEach((e) => console.log(`  - ${e}`));
    }
  } catch (error) {
    console.error('[Runner] Fatal error:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
