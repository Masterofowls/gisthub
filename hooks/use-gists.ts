import { useState, useCallback, useRef } from 'react';
import { Gist } from '../types/github';
import {
  fetchGists,
  fetchStarredGists,
  createGist,
  updateGist,
  deleteGist,
  starGist,
  unstarGist,
} from '../services/github-api';
import { cacheService } from '../services/cache-service';
import { CreateGistPayload, UpdateGistPayload } from '../types/github';

export function useGists(token: string | null) {
  const [gists, setGists] = useState<Gist[]>([]);
  const [starredGists, setStarredGists] = useState<Gist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);

  const loadGists = useCallback(
    async (refresh = false) => {
      if (!token) return;
      if (refresh) {
        setIsRefreshing(true);
        pageRef.current = 1;
        await cacheService.invalidateGistList();
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const cached = await cacheService.getGistList();
        if (cached && !refresh) {
          setGists(cached);
        } else {
          const data = await fetchGists(token, 1, 50);
          setGists(data);
          await cacheService.setGistList(data);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load gists');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token]
  );

  const loadStarred = useCallback(
    async (refresh = false) => {
      if (!token) return;
      if (refresh) await cacheService.invalidateStarredList();
      try {
        const cached = await cacheService.getStarredList();
        if (cached && !refresh) {
          setStarredGists(cached);
        } else {
          const data = await fetchStarredGists(token, 1, 50);
          setStarredGists(data);
          await cacheService.setStarredList(data);
        }
      } catch {
        // silent fail for starred
      }
    },
    [token]
  );

  const create = useCallback(
    async (payload: CreateGistPayload): Promise<Gist> => {
      if (!token) throw new Error('Not authenticated');
      const gist = await createGist(token, payload);
      setGists((prev) => [gist, ...prev]);
      await cacheService.invalidateGistList();
      return gist;
    },
    [token]
  );

  const update = useCallback(
    async (id: string, payload: UpdateGistPayload): Promise<Gist> => {
      if (!token) throw new Error('Not authenticated');
      const gist = await updateGist(token, id, payload);
      setGists((prev) => prev.map((g) => (g.id === id ? gist : g)));
      await cacheService.invalidateGist(id);
      await cacheService.invalidateGistList();
      return gist;
    },
    [token]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!token) throw new Error('Not authenticated');
      await deleteGist(token, id);
      setGists((prev) => prev.filter((g) => g.id !== id));
      await cacheService.invalidateGist(id);
      await cacheService.invalidateGistList();
    },
    [token]
  );

  const star = useCallback(
    async (id: string): Promise<void> => {
      if (!token) return;
      await starGist(token, id);
      await cacheService.invalidateStarredList();
    },
    [token]
  );

  const unstar = useCallback(
    async (id: string): Promise<void> => {
      if (!token) return;
      await unstarGist(token, id);
      setStarredGists((prev) => prev.filter((g) => g.id !== id));
      await cacheService.invalidateStarredList();
    },
    [token]
  );

  return {
    gists,
    starredGists,
    isLoading,
    isRefreshing,
    error,
    loadGists,
    loadStarred,
    create,
    update,
    remove,
    star,
    unstar,
  };
}
