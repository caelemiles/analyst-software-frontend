import { useState, useEffect } from 'react';
import { fetchCurrentSeason } from '../api/client';

const DEFAULT_SEASON = '2025/26';

export function useCurrentSeason(): { season: string; loading: boolean } {
  const [season, setSeason] = useState(DEFAULT_SEASON);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchCurrentSeason();
        if (!cancelled) {
          setSeason(data.currentSeason);
        }
      } catch {
        // Keep default season on error
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { season, loading };
}
