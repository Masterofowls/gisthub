import axios, { AxiosInstance } from 'axios';
import { Gist, User, CreateGistPayload, UpdateGistPayload } from '../types/github';

const BASE = 'https://api.github.com';

function createClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

// ── User ───────────────────────────────────────────────────────────────────
export async function fetchUser(token: string): Promise<User> {
  const client = createClient(token);
  const res = await client.get<User>('/user');
  return res.data;
}

// ── Gists list ─────────────────────────────────────────────────────────────
export async function fetchGists(token: string, page = 1, perPage = 30): Promise<Gist[]> {
  const client = createClient(token);
  const res = await client.get<Gist[]>('/gists', {
    params: { page, per_page: perPage },
  });
  return res.data;
}

export async function fetchStarredGists(token: string, page = 1, perPage = 30): Promise<Gist[]> {
  const client = createClient(token);
  const res = await client.get<Gist[]>('/gists/starred', {
    params: { page, per_page: perPage },
  });
  return res.data;
}

// ── Single gist ────────────────────────────────────────────────────────────
export async function fetchGist(token: string, id: string): Promise<Gist> {
  const client = createClient(token);
  const res = await client.get<Gist>(`/gists/${id}`);
  return res.data;
}

// ── CRUD ───────────────────────────────────────────────────────────────────
export async function createGist(token: string, payload: CreateGistPayload): Promise<Gist> {
  const client = createClient(token);
  const res = await client.post<Gist>('/gists', payload);
  return res.data;
}

export async function updateGist(
  token: string,
  id: string,
  payload: UpdateGistPayload
): Promise<Gist> {
  const client = createClient(token);
  const res = await client.patch<Gist>(`/gists/${id}`, payload);
  return res.data;
}

export async function deleteGist(token: string, id: string): Promise<void> {
  const client = createClient(token);
  await client.delete(`/gists/${id}`);
}

// ── Star ───────────────────────────────────────────────────────────────────
export async function starGist(token: string, id: string): Promise<void> {
  const client = createClient(token);
  await client.put(`/gists/${id}/star`);
}

export async function unstarGist(token: string, id: string): Promise<void> {
  const client = createClient(token);
  await client.delete(`/gists/${id}/star`);
}

export async function isGistStarred(token: string, id: string): Promise<boolean> {
  const client = createClient(token);
  try {
    await client.get(`/gists/${id}/star`);
    return true;
  } catch {
    return false;
  }
}

// ── Fork ───────────────────────────────────────────────────────────────────
export async function forkGist(token: string, id: string): Promise<Gist> {
  const client = createClient(token);
  const res = await client.post<Gist>(`/gists/${id}/forks`);
  return res.data;
}

// ── Fetch raw file content (for truncated files) ───────────────────────────
export async function fetchRawContent(url: string): Promise<string> {
  const res = await axios.get<string>(url);
  return res.data;
}

// ── Public gist (no auth) ──────────────────────────────────────────────────
export async function fetchPublicGist(id: string): Promise<Gist> {
  const res = await axios.get<Gist>(`${BASE}/gists/${id}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  return res.data;
}
