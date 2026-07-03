/**
 * stores/authStore.ts — Phase 1 / W3 auth swap.
 *
 * CONFIG.AUTH_MODE gates the domain: 'live' rides services/auth/authService
 * (S-01/S-02); 'mock' is the pre-backend local flow, kept as an env-gated
 * fallback until the operator smokes the staging swap (kickoff rule — do not
 * delete it in this phase).
 *
 * Email/password login+register have NO backend surface in the locked v1.0
 * registry (S-01 is Apple/Google/guest only). In live mode they reject with
 * a clear message; the screens stay useful in mock mode. Flagged for a
 * product decision (remove screens vs. amend contract) — see the Phase 1
 * close-out notes.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { mockUser } from '../services/mock';
import { CONFIG } from '../constants/config';
import * as authService from '../services/auth/authService';
import { loadCachedUser, loadSession } from '../services/auth/tokenStorage';
import {
  acquireAppleIdentityToken,
  acquireGoogleIdentityToken,
} from '../services/auth/platformSignIn';
import { logEvent } from '../services/logging';

const INTRO_KEY = 'echo_has_seen_intro_v1';
const LAST_ACTIVE_KEY = 'echo_last_active';
const SESSION_MAX_DAYS = 30;

const isLive = CONFIG.AUTH_MODE === 'live';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenIntro: boolean;
  initialize: () => Promise<void>;
  /** Real sign-in paths (S-01). Throw on failure; callers surface the message. */
  loginWithApple: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  /** Guest browsing: acquires a guest-scope API session; not "authenticated". */
  continueAsGuest: () => Promise<void>;
  /** Email/password — mock-only (no v1.0 contract surface). */
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  markIntroSeen: () => Promise<void>;
}

async function readIntroFlag(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(INTRO_KEY)) === 'true';
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenIntro: false,

  initialize: async () => {
    if (!isLive) {
      // ── Mock fallback (pre-backend behavior, unchanged) ────────────────
      await new Promise((r) => setTimeout(r, 350));
      let hasSeenIntro = false;
      let isAuthenticated = false;
      try {
        hasSeenIntro = await readIntroFlag();
        const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
        if (lastActive) {
          const daysSince = (Date.now() - parseInt(lastActive, 10)) / (1000 * 60 * 60 * 24);
          if (daysSince < SESSION_MAX_DAYS) {
            isAuthenticated = true;
            await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
          } else {
            await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
          }
        }
      } catch {
        hasSeenIntro = false;
      }
      set({ isLoading: false, hasSeenIntro, isAuthenticated, user: isAuthenticated ? mockUser : null });
      return;
    }

    // ── Live: session validity = stored refresh token validity ───────────
    const hasSeenIntro = await readIntroFlag();
    const session = await loadSession();
    if (!session) {
      set({ isLoading: false, hasSeenIntro, isAuthenticated: false, user: null });
      return;
    }

    const me = await authService.fetchMe(); // a 401 auto-refreshes via apiClient
    if (me.ok) {
      set({ isLoading: false, hasSeenIntro, isAuthenticated: true, user: authService.meDtoToUser(me.data) });
      return;
    }
    if (me.status === 401 || me.status === 403) {
      // Dead session (401; refresh path already cleared stored credentials)
      // or a guest-scope session (403) — either way, not a signed-in user.
      set({ isLoading: false, hasSeenIntro, isAuthenticated: false, user: null });
      return;
    }
    // Offline / transient server failure: fall back to the cached profile so
    // a cold start without connectivity doesn't sign the user out.
    const cached = await loadCachedUser();
    if (cached) {
      logEvent('auth.bootstrap', 'offline_cached_profile', { status: me.status });
      set({ isLoading: false, hasSeenIntro, isAuthenticated: true, user: authService.meDtoToUser(cached) });
    } else {
      logEvent('auth.bootstrap', 'offline_no_cache', { status: me.status }, 'warn');
      set({ isLoading: false, hasSeenIntro, isAuthenticated: false, user: null });
    }
  },

  loginWithApple: async () => {
    if (!isLive) {
      await get().login('demo@echo.events', 'demo');
      return;
    }
    set({ isLoading: true });
    try {
      const credential = await acquireAppleIdentityToken();
      const result = await authService.signInWithApple(credential.identityToken, credential.name);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  loginWithGoogle: async () => {
    if (!isLive) {
      await get().login('demo@echo.events', 'demo');
      return;
    }
    set({ isLoading: true });
    try {
      const idToken = await acquireGoogleIdentityToken();
      const result = await authService.signInWithGoogle(idToken);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  continueAsGuest: async () => {
    if (!isLive) return;
    try {
      await authService.startGuestSession();
    } catch (e) {
      // Guest browsing still works against public endpoints without a
      // session; don't block navigation on this call.
      logEvent('auth.guest', 'session_failed', { error: String(e) }, 'warn');
    }
  },

  login: async (email, password) => {
    if (isLive) {
      throw new Error('Email sign-in isn’t available yet — use Apple or Google.');
    }
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 700));
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    if (CONFIG.MOCK_MODE) {
      set({ user: { ...mockUser, email }, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
    }
  },

  register: async (data) => {
    if (isLive) {
      throw new Error('Email sign-up isn’t available yet — use Apple or Google.');
    }
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 700));
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    set({
      user: {
        id: 'new-user',
        email: data.email,
        name: `${data.first_name} ${data.last_name}`.trim(),
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    if (isLive) {
      // Revokes the session family server-side; clears local creds regardless.
      await authService.logout();
    }
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
    set({ user: null, isAuthenticated: false });
  },

  deleteAccount: async () => {
    // v1.0 has NO account-deletion endpoint (flagged: App Store requires one
    // before launch — v1.1 candidate). Live mode revokes the session and
    // wipes local data; the server account survives.
    if (isLive) {
      try {
        await authService.logout();
      } catch {
        // Local wipe proceeds regardless.
      }
    }
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);
    } catch {}
    set({ user: null, isAuthenticated: false, hasSeenIntro: false });
  },

  markIntroSeen: async () => {
    try {
      await AsyncStorage.setItem(INTRO_KEY, 'true');
    } catch {}
    set({ hasSeenIntro: true });
    if (isLive && get().isAuthenticated) {
      // Best-effort FTUE flag sync (S-02); local persistence is the truth.
      authService.setFlags({ 'ftue.intro_seen': true }).catch(() => {});
    }
  },
}));
