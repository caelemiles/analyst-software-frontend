/**
 * Main scraper coordinator.
 * Orchestrates data fetching, normalization, and database storage.
 */

import { scrapeLeague } from './fotmob.js';
import { normalizePlayerData, normalizeTeamData } from './normalize.js';
import { upsertPlayer, upsertTeam, hasData } from '../db/queries.js';
import { getPool } from '../db/connection.js';

const CURRENT_SEASON = '2025/26';
const LEAGUE_NAME = 'EFL League Two';

export interface ScrapeResult {
  success: boolean;
  teamsUpserted: number;
  playersUpserted: number;
  errors: string[];
  duration: number;
}

/**
 * Run a full scrape and database update for the league.
 * Returns a result summary.
 */
export async function runScrape(): Promise<ScrapeResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let teamsUpserted = 0;
  let playersUpserted = 0;

  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 SCRAPER STARTED');
  console.log(`[Scraper] League: ${LEAGUE_NAME}`);
  console.log(`[Scraper] Season: ${CURRENT_SEASON}`);
  console.log(`[Scraper] Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════');

  try {
    // STAGE 1: Fetch data from FotMob API
    console.log('[Scraper] [STAGE 1/4] Fetching data from FotMob API...');
    const fetchStart = Date.now();
    const { teams, players } = await scrapeLeague(LEAGUE_NAME);
    const fetchDuration = ((Date.now() - fetchStart) / 1000).toFixed(1);
    console.log(`[Scraper] [STAGE 1/4] API fetch complete in ${fetchDuration}s`);
    console.log(`[Scraper]   📥 Teams fetched: ${teams.length}`);
    console.log(`[Scraper]   📥 Players fetched: ${players.length}`);

    if (teams.length === 0) {
      console.error(`[Scraper] ❌ WARNING: No team data returned for ${LEAGUE_NAME}`);
    }
    if (players.length === 0) {
      console.error(`[Scraper] ❌ WARNING: No player data returned for ${LEAGUE_NAME}`);
    }

    // STAGE 2: Upsert teams into database
    console.log('[Scraper] [STAGE 2/4] Inserting/updating teams in database...');
    for (const team of teams) {
      try {
        const normalized = normalizeTeamData(team, CURRENT_SEASON, LEAGUE_NAME);
        await upsertTeam(normalized);
        teamsUpserted++;
        console.log(`[Scraper]   ✅ Team upserted: ${team.name} (${teamsUpserted}/${teams.length})`);
      } catch (error) {
        const msg = `Failed to upsert team ${team.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[Scraper]   ❌ ${msg}`);
        errors.push(msg);
      }
    }
    console.log(`[Scraper] [STAGE 2/4] Teams complete: ${teamsUpserted} upserted, ${errors.length} errors`);

    // STAGE 3: Upsert players into database
    console.log('[Scraper] [STAGE 3/4] Inserting/updating players in database...');
    for (const player of players) {
      try {
        const normalized = normalizePlayerData(player, CURRENT_SEASON, LEAGUE_NAME);
        await upsertPlayer(normalized);
        playersUpserted++;
        if (playersUpserted % 25 === 0 || playersUpserted === players.length) {
          console.log(`[Scraper]   💾 Players progress: ${playersUpserted}/${players.length} upserted`);
        }
      } catch (error) {
        const msg = `Failed to upsert player ${player.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[Scraper]   ❌ ${msg}`);
        errors.push(msg);
      }
    }
    console.log(`[Scraper] [STAGE 3/4] Players complete: ${playersUpserted} upserted, ${errors.length} total errors`);

    // STAGE 4: Verify data in database
    console.log('[Scraper] [STAGE 4/4] Verifying data in database...');
    try {
      const db = getPool();
      const totalCheck = await db.query('SELECT COUNT(*) as count FROM players');
      const seasonCheck = await db.query(
        'SELECT COUNT(*) as count FROM players WHERE season = $1',
        [CURRENT_SEASON]
      );
      const leagueCheck = await db.query(
        'SELECT COUNT(*) as count FROM players WHERE league = $1 AND season = $2',
        [LEAGUE_NAME, CURRENT_SEASON]
      );
      console.log(`[Scraper]   📊 Total players in DB: ${totalCheck.rows[0].count}`);
      console.log(`[Scraper]   📊 Players for season ${CURRENT_SEASON}: ${seasonCheck.rows[0].count}`);
      console.log(`[Scraper]   📊 Players for ${LEAGUE_NAME} ${CURRENT_SEASON}: ${leagueCheck.rows[0].count}`);
    } catch (dbErr) {
      console.error(`[Scraper]   ❌ Failed to verify player count: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ SCRAPER FINISHED in ${duration.toFixed(1)}s`);
    console.log(`   Teams: ${teamsUpserted}/${teams.length} upserted`);
    console.log(`   Players: ${playersUpserted}/${players.length} upserted`);
    console.log(`   Errors: ${errors.length}`);
    console.log('═══════════════════════════════════════════════════════');

    return {
      success: errors.length === 0,
      teamsUpserted,
      playersUpserted,
      errors,
      duration,
    };
  } catch (error) {
    const msg = `Scrape failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[Scraper] ❌ FATAL: ${msg}`);
    if (error instanceof Error && error.stack) {
      console.error(`[Scraper]   Stack: ${error.stack}`);
    }
    errors.push(msg);

    return {
      success: false,
      teamsUpserted,
      playersUpserted,
      errors,
      duration: (Date.now() - startTime) / 1000,
    };
  }
}

/**
 * Check if we need to scrape (no data exists yet).
 */
export async function needsInitialScrape(): Promise<boolean> {
  try {
    return !(await hasData(CURRENT_SEASON));
  } catch {
    return true;
  }
}

export { CURRENT_SEASON, LEAGUE_NAME };
