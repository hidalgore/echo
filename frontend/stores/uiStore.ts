/**
 * UI Store — ephemeral UI state
 * ═══════════════════════════════
 * Lightweight session-only store for cross-component UI signals.
 * Not persisted. Drives:
 *   - Bottom tab bar visibility (scroll-hide on Home).
 *   - Bookmark add pulse (wallet tab icon halo).
 */
import { create } from 'zustand';

interface UIState {
  // Bottom tab bar visibility
  tabBarVisible: boolean;
  setTabBarVisible: (v: boolean) => void;

  // Bookmark add pulse — monotonic token; subscribers re-trigger animation on every increment
  bookmarkPulseToken: number;
  triggerBookmarkPulse: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  tabBarVisible: true,
  setTabBarVisible: (v) => set((s) => (s.tabBarVisible === v ? s : { tabBarVisible: v })),

  bookmarkPulseToken: 0,
  triggerBookmarkPulse: () => set((s) => ({ bookmarkPulseToken: s.bookmarkPulseToken + 1 })),
}));
