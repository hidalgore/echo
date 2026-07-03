/**
 * services/auth/authService.ts
 * ════════════════════════════
 * The auth domain's only network surface (Phase 1 / W3). Auth is not an
 * EchoPorts port — authStore delegates here, and this module rides apiCall
 * against the locked S-01/S-02 endpoints.
 *
 * Owns the single-flight refresh: every concurrent 401 shares one
 * /v1/auth/refresh round trip (rotation makes a second concurrent attempt
 * with the same refresh token a THEFT SIGNAL server-side — single-flight is
 * correctness here, not just an optimization).
 */

import { Platform } from 'react-native';
import { apiCall } from '../api/apiClient';
import type { ApiResult } from '../../types/api/shared';
import type { DeviceInDTO, MeDTO, SessionDTO } from '../../types/api/dto';
import type { User } from '../../types';
import { CONFIG } from '../../constants/config';
import {
  clearSession,
  getInstallId,
  getRefreshTokenSync,
  loadSession,
  saveCachedUser,
  saveSession,
} from './tokenStorage';

// ─── Mapping ─────────────────────────────────────────────────────────────────

export function meDtoToUser(dto: MeDTO): User {
  return {
    id: dto.echo_id,
    email: dto.email ?? '',
    name: dto.name,
    phone: dto.phone || undefined,
    avatar_url: dto.avatar_url || null,
    created_at: dto.created_at,
  };
}

// ─── Device descriptor ───────────────────────────────────────────────────────

async function devicePayload(): Promise<DeviceInDTO> {
  return {
    install_id: await getInstallId(),
    platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
    os_version: String(Platform.Version ?? ''),
    app_version: CONFIG.APP_VERSION,
  };
}

// ─── Session lifecycle ───────────────────────────────────────────────────────

export type SignInResult = { user: User | null; isNewUser: boolean };

async function persistSession(session: SessionDTO): Promise<void> {
  await saveSession({ accessToken: session.access_token, refreshToken: session.refresh_token });
  if (session.user) await saveCachedUser(session.user);
}

async function signInWith(
  endpoint: 'authApple' | 'authGoogle',
  identityToken: string,
  name?: string,
): Promise<SignInResult> {
  const result = await apiCall<SessionDTO>(endpoint, {
    body: { identity_token: identityToken, ...(name ? { name } : {}), device: await devicePayload() },
  });
  if (!result.ok) throw new AuthApiError(result);
  await persistSession(result.data);
  return {
    user: result.data.user ? meDtoToUser(result.data.user) : null,
    isNewUser: result.data.is_new_user === true,
  };
}

export function signInWithApple(identityToken: string, name?: string): Promise<SignInResult> {
  return signInWith('authApple', identityToken, name);
}

export function signInWithGoogle(identityToken: string): Promise<SignInResult> {
  return signInWith('authGoogle', identityToken);
}

/** Anonymous guest-scope session (S-01). */
export async function startGuestSession(): Promise<void> {
  const result = await apiCall<SessionDTO>('guestSession', {
    body: { device: await devicePayload() },
  });
  if (!result.ok) throw new AuthApiError(result);
  await persistSession(result.data);
}

/**
 * Single-flight rotation. Returns the fresh access token, or null when no
 * token could be obtained. Local credentials are cleared ONLY when the
 * server definitively refuses the refresh token (401 — expired, revoked, or
 * reuse-revoked); transient failures (network/5xx/429) return null but keep
 * the stored session so a later attempt can still succeed.
 */
let refreshInFlight: Promise<string | null> | null = null;

export function refreshSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<string | null> {
  await loadSession();
  const refreshToken = getRefreshTokenSync();
  if (!refreshToken) return null;

  const result = await apiCall<SessionDTO>('authRefresh', { body: { refresh_token: refreshToken } });
  if (result.ok) {
    await persistSession(result.data);
    return result.data.access_token;
  }
  if (result.status === 401) {
    // Server says this session is dead (expired, revoked, or reuse-revoked).
    await clearSession();
    return null;
  }
  // Transient failure (network/5xx/429): keep credentials for a later attempt.
  return null;
}

/** Revoke server-side, then clear local credentials regardless of outcome. */
export async function logout(): Promise<void> {
  await loadSession();
  const refreshToken = getRefreshTokenSync();
  try {
    if (refreshToken) {
      await apiCall<{ ok: true }>('authLogout', { body: { refresh_token: refreshToken } });
    }
  } finally {
    await clearSession();
  }
}

// ─── Me surface (S-02) ───────────────────────────────────────────────────────

export async function fetchMe(): Promise<ApiResult<MeDTO>> {
  const result = await apiCall<MeDTO>('me');
  if (result.ok) await saveCachedUser(result.data);
  return result;
}

export async function updateMe(
  patch: Partial<Pick<MeDTO, 'name' | 'phone' | 'avatar_url'>>,
): Promise<ApiResult<MeDTO>> {
  const result = await apiCall<MeDTO>('meUpdate', { body: patch });
  if (result.ok) await saveCachedUser(result.data);
  return result;
}

export function setFlags(
  flags: Record<string, boolean | number | string | null>,
): Promise<ApiResult<{ flags: MeDTO['flags'] }>> {
  return apiCall<{ flags: MeDTO['flags'] }>('meFlags', { body: { flags } });
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class AuthApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(result: Extract<ApiResult<unknown>, { ok: false }>) {
    super(result.error.message);
    this.name = 'AuthApiError';
    this.code = result.error.code;
    this.status = result.status;
  }
}
