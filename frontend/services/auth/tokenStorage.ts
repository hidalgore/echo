/**
 * services/auth/tokenStorage.ts
 * ═════════════════════════════
 * Session credential persistence (Phase 1 / W3).
 *
 * Native: expo-secure-store (Keychain / Keystore). Web: AsyncStorage
 * (localStorage) — the platform has no OS keychain; the refresh token living
 * in localStorage is a known, flagged tradeoff shared by every web app.
 *
 * Also owns the stable per-install id sent as `device.install_id` and a
 * cached copy of the signed-in profile for offline cold starts. Neither is
 * secret, so both live in AsyncStorage on every platform.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { MeDTO } from '../../types/api/dto';

const ACCESS_KEY = 'echo_access_token_v1';
const REFRESH_KEY = 'echo_refresh_token_v1';
const INSTALL_ID_KEY = 'echo_install_id_v1';
const CACHED_USER_KEY = 'echo_cached_me_v1';

const isWeb = Platform.OS === 'web';

async function secureGet(key: string): Promise<string | null> {
  try {
    return isWeb ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
  } catch {
    return null; // corrupted entry or keychain unavailable — treat as signed out
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  if (isWeb) await AsyncStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (isWeb) await AsyncStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // Deleting an absent key must never fail a logout.
  }
}

export type StoredSession = { accessToken: string; refreshToken: string };

// In-memory mirror so the bearer hook is synchronous-fast after first load.
let cached: StoredSession | null | undefined; // undefined = not loaded yet

export async function loadSession(): Promise<StoredSession | null> {
  if (cached !== undefined) return cached;
  const [accessToken, refreshToken] = await Promise.all([
    secureGet(ACCESS_KEY),
    secureGet(REFRESH_KEY),
  ]);
  cached = accessToken && refreshToken ? { accessToken, refreshToken } : null;
  return cached;
}

export async function saveSession(session: StoredSession): Promise<void> {
  cached = session;
  await Promise.all([
    secureSet(ACCESS_KEY, session.accessToken),
    secureSet(REFRESH_KEY, session.refreshToken),
  ]);
}

export async function clearSession(): Promise<void> {
  cached = null;
  await Promise.all([secureDelete(ACCESS_KEY), secureDelete(REFRESH_KEY), secureDelete(CACHED_USER_KEY)]);
}

/** Synchronous access for the apiClient bearer hook (loadSession must have
 * run once at bootstrap; before that, requests are correctly anonymous). */
export function getAccessTokenSync(): string | null {
  return cached ? cached.accessToken : null;
}

export function getRefreshTokenSync(): string | null {
  return cached ? cached.refreshToken : null;
}

// ─── Install id ──────────────────────────────────────────────────────────────

function newInstallId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `inst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function getInstallId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (existing) return existing;
  } catch {
    // fall through to mint a fresh one
  }
  const minted = newInstallId();
  try {
    await AsyncStorage.setItem(INSTALL_ID_KEY, minted);
  } catch {
    // Non-persistent storage: a per-launch id still satisfies the backend.
  }
  return minted;
}

// ─── Cached profile (offline cold start) ─────────────────────────────────────

export async function saveCachedUser(user: MeDTO): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } catch {
    // cache only — losing it costs one network round trip
  }
}

export async function loadCachedUser(): Promise<MeDTO | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as MeDTO) : null;
  } catch {
    return null;
  }
}
