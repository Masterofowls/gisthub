import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { DeviceCodeResponse, AuthMode } from '../types/github';

const GITHUB_API = 'https://api.github.com';
const GITHUB_OAUTH = 'https://github.com';
const TOKEN_KEY = 'gisthub_token';
const AUTH_MODE_KEY = 'gisthub_auth_mode';

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ?? '';
const SCOPES = 'gist read:user';

// ── Token storage ──────────────────────────────────────────────────────────
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}

export async function saveAuthMode(mode: AuthMode): Promise<void> {
  await SecureStore.setItemAsync(AUTH_MODE_KEY, mode);
}

export async function getAuthMode(): Promise<AuthMode | null> {
  const val = await SecureStore.getItemAsync(AUTH_MODE_KEY);
  return (val as AuthMode) ?? null;
}

// ── Device Flow ────────────────────────────────────────────────────────────
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await axios.post<DeviceCodeResponse>(
    `${GITHUB_OAUTH}/login/device/code`,
    { client_id: CLIENT_ID, scope: SCOPES },
    { headers: { Accept: 'application/json' } }
  );
  return res.data;
}

export async function pollDeviceToken(
  deviceCode: string,
  intervalSec: number,
  signal: AbortSignal
): Promise<string> {
  const interval = Math.max(intervalSec, 5) * 1000;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      if (signal.aborted) {
        reject(new Error('Cancelled'));
        return;
      }
      try {
        const res = await axios.post<Record<string, string>>(
          `${GITHUB_OAUTH}/login/oauth/access_token`,
          {
            client_id: CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          },
          { headers: { Accept: 'application/json' } }
        );
        const data = res.data;

        if (data.access_token) {
          resolve(data.access_token);
        } else if (data.error === 'authorization_pending') {
          setTimeout(poll, interval);
        } else if (data.error === 'slow_down') {
          setTimeout(poll, interval + 5000);
        } else if (data.error === 'expired_token') {
          reject(new Error('Code expired. Please try again.'));
        } else if (data.error === 'access_denied') {
          reject(new Error('Access denied by user.'));
        } else {
          reject(new Error(data.error_description ?? data.error ?? 'Unknown error'));
        }
      } catch (err) {
        reject(err);
      }
    };

    setTimeout(poll, interval);
  });
}

// ── PAT validation ─────────────────────────────────────────────────────────
export async function validatePAT(token: string): Promise<boolean> {
  try {
    const res = await axios.get(`${GITHUB_API}/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}
