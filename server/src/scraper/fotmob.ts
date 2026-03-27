/**
 * FotMob scraper module for EFL League Two player and team data.
 *
 * Uses FotMob's public API endpoints to fetch league standings,
 * team squads, and player statistics for the current season.
 */

// FotMob league IDs
const FOTMOB_LEAGUE_IDS: Record<string, number> = {
  'EFL League Two': 135,
  'EFL League One': 134,
  'EFL Championship': 48,
};

const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<unknown> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Scraper] Attempt ${attempt}/${retries} failed for ${url}: ${message}`);

      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`[Scraper] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw new Error(`[Scraper] All ${retries} attempts failed for ${url}: ${message}`);
      }
    }
  }
  throw new Error('[Scraper] Unreachable');
}

export interface ScrapedPlayer {
  name: string;
  team: string;
  position: string;
  age: number;
  nationality: string;
  image_url?: string;
  appearances: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  minutes_played: number;
  rating: number;
  yellow_cards: number;
  red_cards: number;
}

export interface ScrapedTeam {
  name: string;
  fotmob_id?: number;
  logo?: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form?: string;
}

interface FotMobLeagueResponse {
  table?: Array<{
    data?: {
      table?: {
        all?: Array<{
          name?: string;
          id?: number;
          idx?: number;
          played?: number;
          wins?: number;
          draws?: number;
          losses?: number;
          scoresStr?: string;
          goalConDiff?: number;
          pts?: number;
          ongoing?: unknown;
        }>;
      };
    };
  }>;
  details?: {
    name?: string;
    selectedSeason?: string;
  };
}

interface FotMobTeamResponse {
  squad?: Array<Array<{
    id?: number;
    name?: string;
    role?: string;
    ccode?: string;
  }>>;
  details?: {
    name?: string;
    id?: number;
  };
}

interface FotMobPlayerResponse {
  name?: string;
  origin?: {
    country?: { text?: string };
  };
  primaryTeam?: {
    teamName?: string;
  };
  positionDescription?: { primaryPosition?: { label?: string } };
  birthDate?: { utcTime?: string };
  statSeasons?: Array<{
    seasonName?: string;
    tournaments?: Array<{
      name?: string;
      tournamentId?: number;
      stats?: Array<{
        key?: string;
        value?: number | string;
      }>;
    }>;
  }>;
  mainLeague?: {
    stats?: Array<{
      key?: string;
      value?: number | string;
    }>;
  };
}

/**
 * Fetch league standings from FotMob.
 */
export async function fetchLeagueStandings(leagueName: string): Promise<ScrapedTeam[]> {
  const leagueId = FOTMOB_LEAGUE_IDS[leagueName];
  if (!leagueId) {
    throw new Error(`[Scraper] Unknown league: ${leagueName}`);
  }

  console.log(`[Scraper] Fetching standings for ${leagueName} (FotMob ID: ${leagueId})...`);

  const data = await fetchWithRetry(
    `${FOTMOB_BASE_URL}/leagues?id=${leagueId}`
  ) as FotMobLeagueResponse;

  const teams: ScrapedTeam[] = [];

  const tableData = data.table?.[0]?.data?.table?.all;
  if (!tableData || !Array.isArray(tableData)) {
    console.warn('[Scraper] No standings data found in FotMob response');
    return teams;
  }

  for (const entry of tableData) {
    const scores = entry.scoresStr?.split('-').map(s => parseInt(s.trim(), 10)) ?? [0, 0];
    const goalsFor = scores[0] ?? 0;
    const goalsAgainst = scores[1] ?? 0;

    teams.push({
      name: entry.name ?? 'Unknown',
      fotmob_id: entry.id,
      position: entry.idx ?? 0,
      played: entry.played ?? 0,
      won: entry.wins ?? 0,
      drawn: entry.draws ?? 0,
      lost: entry.losses ?? 0,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      goal_difference: entry.goalConDiff ?? goalsFor - goalsAgainst,
      points: entry.pts ?? 0,
    });
  }

  console.log(`[Scraper] Found ${teams.length} teams in ${leagueName}`);
  return teams;
}

/**
 * Fetch team squad data from FotMob.
 */
export async function fetchTeamSquad(teamId: number, teamName: string): Promise<Array<{ id: number; name: string; role: string; nationality: string }>> {
  console.log(`[Scraper] Fetching squad for ${teamName} (ID: ${teamId})...`);

  const data = await fetchWithRetry(
    `${FOTMOB_BASE_URL}/teams?id=${teamId}`
  ) as FotMobTeamResponse;

  const players: Array<{ id: number; name: string; role: string; nationality: string }> = [];

  if (!data.squad || !Array.isArray(data.squad)) {
    console.warn(`[Scraper] No squad data for team ${teamName}`);
    return players;
  }

  for (const group of data.squad) {
    if (!Array.isArray(group)) continue;
    for (const member of group) {
      if (member.id && member.name) {
        players.push({
          id: member.id,
          name: member.name,
          role: member.role ?? 'Unknown',
          nationality: member.ccode ?? 'Unknown',
        });
      }
    }
  }

  console.log(`[Scraper] Found ${players.length} players in ${teamName}`);
  return players;
}

/**
 * Fetch individual player stats from FotMob.
 */
export async function fetchPlayerStats(playerId: number): Promise<ScrapedPlayer | null> {
  try {
    const data = await fetchWithRetry(
      `${FOTMOB_BASE_URL}/playerData?id=${playerId}`
    ) as FotMobPlayerResponse;

    if (!data.name) return null;

    // Calculate age from birth date
    let age = 0;
    if (data.birthDate?.utcTime) {
      const birthDate = new Date(data.birthDate.utcTime);
      const now = new Date();
      age = now.getFullYear() - birthDate.getFullYear();
      const monthDiff = now.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Map position role to simplified position name
    const positionLabel = data.positionDescription?.primaryPosition?.label ?? 'Unknown';
    const position = mapPosition(positionLabel);

    // Extract stats from mainLeague
    const stats = new Map<string, number>();
    if (data.mainLeague?.stats) {
      for (const stat of data.mainLeague.stats) {
        if (stat.key && stat.value !== undefined) {
          stats.set(stat.key, typeof stat.value === 'number' ? stat.value : parseFloat(String(stat.value)) || 0);
        }
      }
    }

    return {
      name: data.name,
      team: data.primaryTeam?.teamName ?? 'Unknown',
      position,
      age,
      nationality: data.origin?.country?.text ?? 'Unknown',
      appearances: stats.get('matches') ?? stats.get('started') ?? 0,
      goals: stats.get('goals') ?? 0,
      assists: stats.get('assists') ?? 0,
      xg: stats.get('expected_goals') ?? stats.get('xg') ?? 0,
      xa: stats.get('expected_assists') ?? stats.get('xa') ?? 0,
      minutes_played: stats.get('minutes_played') ?? 0,
      rating: stats.get('rating') ?? 0,
      yellow_cards: stats.get('yellow_cards') ?? 0,
      red_cards: stats.get('red_cards') ?? 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Scraper] Failed to fetch player ${playerId}: ${message}`);
    return null;
  }
}

function mapPosition(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('keeper') || r.includes('goalkeeper')) return 'Goalkeeper';
  if (r.includes('back') || r.includes('defender') || r.includes('centre-back') || r.includes('cb')) return 'Defender';
  if (r.includes('mid') || r.includes('wing')) return 'Midfielder';
  if (r.includes('forward') || r.includes('striker') || r.includes('attack')) return 'Forward';
  return 'Unknown';
}

/**
 * Full scrape: fetch all teams and players for a league.
 * Returns scraped data without writing to DB.
 */
export async function scrapeLeague(leagueName: string): Promise<{
  teams: ScrapedTeam[];
  players: ScrapedPlayer[];
}> {
  console.log(`[Scraper] Starting full scrape for ${leagueName}...`);
  const startTime = Date.now();

  // Step 1: Get league standings
  const teams = await fetchLeagueStandings(leagueName);

  if (teams.length === 0) {
    console.warn('[Scraper] No teams found, aborting scrape');
    return { teams: [], players: [] };
  }

  // Step 2: Iterate through each team and fetch squad + player stats
  const players: ScrapedPlayer[] = [];
  let playersFetched = 0;
  let playersFailed = 0;

  for (const team of teams) {
    if (!team.fotmob_id) {
      console.warn(`[Scraper] No FotMob ID for team ${team.name}, skipping squad fetch`);
      continue;
    }

    try {
      const squad = await fetchTeamSquad(team.fotmob_id, team.name);
      await sleep(REQUEST_DELAY_MS);

      for (const member of squad) {
        try {
          const playerStats = await fetchPlayerStats(member.id);
          if (playerStats) {
            players.push(playerStats);
            playersFetched++;
            console.log(`[INFO] Scraper: Player ${playerStats.name} fetched successfully`);
          } else {
            playersFailed++;
            console.warn(`[Scraper] No stats returned for player ${member.name} (ID: ${member.id})`);
          }
        } catch (error) {
          playersFailed++;
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[ERROR] Scraper: Failed to fetch player ${member.name} (ID: ${member.id}): ${message}`);
        }
        await sleep(REQUEST_DELAY_MS);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] Scraper: Failed to fetch squad for ${team.name}: ${message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Scraper] Scrape complete in ${elapsed}s: ${teams.length} teams, ${players.length} players (${playersFetched} fetched, ${playersFailed} failed)`);

  return { teams, players };
}

export { FOTMOB_LEAGUE_IDS, REQUEST_DELAY_MS };
