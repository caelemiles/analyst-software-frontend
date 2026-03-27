import { describe, it, expect } from 'vitest';
import { config } from '../src/config.js';

describe('config', () => {
  it('returns default values when env vars are not set', () => {
    const original = { ...process.env };

    delete process.env.DATABASE_URL;
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.API_FOOTBALL_KEY;
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.SCRAPE_INTERVAL_HOURS;

    const cfg = config();

    expect(cfg.databaseUrl).toBe('');
    expect(cfg.port).toBe(8000);
    expect(cfg.nodeEnv).toBe('development');
    expect(cfg.apiFootballKey).toBe('');
    expect(cfg.youtubeApiKey).toBe('');
    expect(cfg.scrapeIntervalHours).toBe(12);

    // Restore env
    Object.assign(process.env, original);
  });

  it('reads values from environment variables', () => {
    const original = { ...process.env };

    process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'production';
    process.env.API_FOOTBALL_KEY = 'test-key';
    process.env.YOUTUBE_API_KEY = 'yt-key';
    process.env.SCRAPE_INTERVAL_HOURS = '12';

    const cfg = config();

    expect(cfg.databaseUrl).toBe('postgresql://test:test@localhost/test');
    expect(cfg.port).toBe(3000);
    expect(cfg.nodeEnv).toBe('production');
    expect(cfg.apiFootballKey).toBe('test-key');
    expect(cfg.youtubeApiKey).toBe('yt-key');
    expect(cfg.scrapeIntervalHours).toBe(12);

    // Restore env
    Object.keys(process.env).forEach(key => {
      if (!(key in original)) delete process.env[key];
    });
    Object.assign(process.env, original);
  });
});
