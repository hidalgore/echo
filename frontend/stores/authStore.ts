import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { mockUser } from '../services/mock';
import { CONFIG } from '../constants/config';

const INTRO_KEY = 'echo_has_seen_intro_v1';
const LAST_ACTIVE_KEY = 'echo_last_active';
const SESSION_MAX_DAYS = 30;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenIntro: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  markIntroSeen: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenIntro: false,

  initialize: async () => {
    await new Promise((r) => setTimeout(r, 350));
    let hasSeenIntro = false;
    let isAuthenticated = false;

    try {
      hasSeenIntro = (await AsyncStorage.getItem(INTRO_KEY)) === 'true';

      // Check session persistence
      const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActive) {
        const elapsed = Date.now() - parseInt(lastActive, 10);
        const daysSince = elapsed / (1000 * 60 * 60 * 24);
        if (daysSince < SESSION_MAX_DAYS) {
          // Session still valid — auto-authenticate
          isAuthenticated = true;
          // Update last active timestamp
          await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
        } else {
          // Session expired — clear and require fresh login
          await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
        }
      }
    } catch {
      hasSeenIntro = false;
    }

    set({
      isLoading: false,
      hasSeenIntro,
      isAuthenticated,
      user: isAuthenticated ? mockUser : null,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 700));

    // Persist session timestamp
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));

    if (CONFIG.MOCK_MODE) {
      set({ user: { ...mockUser, email }, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
    }
  },

  register: async (data) => {
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
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
    set({ user: null, isAuthenticated: false });
  },

  deleteAccount: async () => {
    // Permanently delete all user data
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
  },
}));
