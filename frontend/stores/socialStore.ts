/**
 * ECHO Social Promotion — Store
 * ══════════════════════════════
 */
import { create } from 'zustand';
import type { SocialAccount, SocialProvider, PromotionHistory, PromotionPackage, PromoFormat } from '../types/social';
import {
  fetchSocialAccounts, connectSocialAccount, disconnectSocialAccount,
  refreshSocialAccount, buildPromotionPackage, publishPromotion,
  fetchPromotionHistory,
} from '../services/socialMock';

interface SocialState {
  accounts: SocialAccount[];
  history: PromotionHistory[];
  currentPackage: PromotionPackage | null;
  isLoading: boolean;
  isPublishing: boolean;

  // Actions
  loadAccounts: () => Promise<void>;
  linkAccount: (provider: SocialProvider) => Promise<void>;
  unlinkAccount: (accountId: string) => Promise<void>;
  reconnectAccount: (accountId: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  createPackage: (eventId: string, provider: SocialProvider, format: PromoFormat) => Promise<void>;
  publish: () => Promise<void>;
  clearPackage: () => void;

  // Selectors
  getAccountByProvider: (provider: SocialProvider) => SocialAccount | undefined;
  getLinkedProviders: () => SocialProvider[];
  hasAnyLinked: () => boolean;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  accounts: [],
  history: [],
  currentPackage: null,
  isLoading: false,
  isPublishing: false,

  loadAccounts: async () => {
    set({ isLoading: true });
    const accounts = await fetchSocialAccounts();
    set({ accounts, isLoading: false });
  },

  linkAccount: async (provider) => {
    set({ isLoading: true });
    const newAcct = await connectSocialAccount(provider);
    set(s => ({ accounts: [...s.accounts, newAcct], isLoading: false }));
  },

  unlinkAccount: async (accountId) => {
    await disconnectSocialAccount(accountId);
    set(s => ({ accounts: s.accounts.filter(a => a.id !== accountId) }));
  },

  reconnectAccount: async (accountId) => {
    const refreshed = await refreshSocialAccount(accountId);
    set(s => ({ accounts: s.accounts.map(a => a.id === accountId ? refreshed : a) }));
  },

  loadHistory: async () => {
    const history = await fetchPromotionHistory();
    set({ history });
  },

  createPackage: async (eventId, provider, format) => {
    set({ isLoading: true });
    const pkg = await buildPromotionPackage(eventId, provider, format);
    set({ currentPackage: pkg, isLoading: false });
  },

  publish: async () => {
    const pkg = get().currentPackage;
    if (!pkg) return;
    set({ isPublishing: true });
    const result = await publishPromotion(pkg.id);
    set({ currentPackage: result, isPublishing: false });
  },

  clearPackage: () => set({ currentPackage: null }),

  getAccountByProvider: (provider) => get().accounts.find(a => a.provider === provider),
  getLinkedProviders: () => get().accounts.filter(a => a.status === 'connected').map(a => a.provider),
  hasAnyLinked: () => get().accounts.some(a => a.status === 'connected' || a.status === 'export_only'),
}));
