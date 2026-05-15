import { useState, useCallback } from 'react';
import { Gist } from '../types/github';
import { fetchGist, isGistStarred } from '../services/github-api';
import { cacheService } from '../services/cache-service';

export function useGist(token: string | null) {
  const [gist, setGist] = useState<Gist | null>(null);
  const [starred, setStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (id: string, forceRefresh = false) => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const cached = await cacheService.getGist(id);
        if (cached && !forceRefresh) {
          setGist(cached);
        } else {
          const data = await fetchGist(token, id);
          setGist(data);
          await cacheService.setGist(id, data);
        }
        const starStatus = await isGistStarred(token, id);
        setStarred(starStatus);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load gist');
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  return { gist, starred, setStarred, isLoading, error, load };
}
