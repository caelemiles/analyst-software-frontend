export interface AppConfig {
  databaseUrl: string;
  port: number;
  nodeEnv: string;
  apiFootballKey: string;
  youtubeApiKey: string;
  scrapeIntervalHours: number;
}

export function config(): AppConfig {
  return {
    databaseUrl: process.env.DATABASE_URL ?? '',
    port: parseInt(process.env.PORT ?? '8000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    apiFootballKey: process.env.API_FOOTBALL_KEY ?? '',
    youtubeApiKey: process.env.YOUTUBE_API_KEY ?? '',
    scrapeIntervalHours: parseInt(process.env.SCRAPE_INTERVAL_HOURS ?? '12', 10),
  };
}
