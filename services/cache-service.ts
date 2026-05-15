import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gist } from '../types/github';

const TTL_LIST = 5 * 60 * 1000; // 5 min
const TTL_GIST = 15 * 60 * 1000; // 15 min

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

async function get<T>(key: string, ttl: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttl) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function set<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

// ── Public API ─────────────────────────────────────────────────────────────
export const cacheService = {
  getGistList: () => get<Gist[]>('gists_list', TTL_LIST),
  setGistList: (data: Gist[]) => set('gists_list', data),
  invalidateGistList: () => remove('gists_list'),

  getStarredList: () => get<Gist[]>('gists_starred', TTL_LIST),
  setStarredList: (data: Gist[]) => set('gists_starred', data),
  invalidateStarredList: () => remove('gists_starred'),

  getGist: (id: string) => get<Gist>(`gist_${id}`, TTL_GIST),
  setGist: (id: string, data: Gist) => set(`gist_${id}`, data),
  invalidateGist: (id: string) => remove(`gist_${id}`),

  clearAll: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const gistKeys = keys.filter(
      (k) => k.startsWith('gist_') || k === 'gists_list' || k === 'gists_starred'
    );
    if (gistKeys.length) await AsyncStorage.multiRemove(gistKeys);
  },
};
