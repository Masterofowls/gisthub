export interface GistFile {
  filename: string;
  type: string;
  language: string | null;
  raw_url: string;
  size: number;
  content?: string;
  truncated?: boolean;
}

export interface GistOwner {
  login: string;
  avatar_url: string;
  html_url: string;
  id: number;
}

export interface GistFork {
  id: string;
  created_at: string;
  user: GistOwner;
}

export interface Gist {
  id: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  html_url: string;
  git_pull_url: string;
  git_push_url: string;
  files: Record<string, GistFile>;
  owner: GistOwner;
  forks_url: string;
  commits_url: string;
  comments: number;
  truncated?: boolean;
}

export interface User {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_gists: number;
  private_gists?: number;
  email: string | null;
  followers: number;
  following: number;
}

export interface CreateGistPayload {
  description: string;
  public: boolean;
  files: Record<string, { content: string }>;
}

export interface UpdateGistPayload {
  description?: string;
  files?: Record<string, { content: string } | null>;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface GistExport {
  exported_at: string;
  version: string;
  gists: Gist[];
}

export type AuthMode = 'device' | 'pat';
