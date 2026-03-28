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

  console.log('🚀 SCRAPER STARTED');
  console.log(`[Scraper] Starting scrape for ${LEAGUE_NAME} season ${CURRENT_SEASON}...`);

  try {
    // Fetch data from FotMob
    const { teams, players } = await scrapeLeague(LEAGUE_NAME);

    console.log(`📥 Scraped players count: ${players.length}`);

    if (teams.length === 0) {
      console.error(`[ERROR] API Football: No team data returned for ${LEAGUE_NAME}`);
    }
    if (players.length === 0) {
      console.log('❌ SCRAPER RETURNED 0 PLAYERS');
      if (teams.length > 0) {
        console.error(`[ERROR] API Football: Player data missing for ${LEAGUE_NAME}`);
      }
    }

    // Upsert teams
    for (const team of teams) {
      try {
        const normalized = normalizeTeamData(team, CURRENT_SEASON, LEAGUE_NAME);
        await upsertTeam(normalized);
        teamsUpserted++;
        console.log(`[INFO] Scraper: Team ${team.name} inserted/updated successfully`);
      } catch (error) {
        const msg = `Failed to upsert team ${team.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[ERROR] Database: ${msg}`);
        errors.push(msg);
      }
    }

    // Upsert players
    console.log('💾 Inserting players into DB...');
    for (const player of players) {
      try {
        console.log(`➡️ Inserting: ${player.name}`);
        const normalized = normalizePlayerData(player, CURRENT_SEASON, LEAGUE_NAME);
        await upsertPlayer(normalized);
        playersUpserted++;
        console.log(`[INFO] Scraper: Player ${player.name} inserted/updated successfully`);
      } catch (error) {
        const msg = `Failed to upsert player ${player.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[ERROR] Database: ${msg}`);
        errors.push(msg);
      }
    }

    // Verify total players in DB after insert
    try {
      const db = getPool();
      const check = await db.query('SELECT COUNT(*) FROM players');
      console.log(`📊 TOTAL PLAYERS IN DB: ${check.rows[0].count}`);
    } catch (dbErr) {
      console.error('❌ Failed to verify player count in DB:', dbErr);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Scraper] Scrape complete in ${duration.toFixed(1)}s: ${teamsUpserted} teams, ${playersUpserted} players upserted`);

    return {
      success: errors.length === 0,
      teamsUpserted,
      playersUpserted,
      errors,
      duration,
    };
  } catch (error) {
    const msg = `Scrape failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[ERROR] Scraper: ${msg}`);
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
