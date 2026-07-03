/**
 * ECHO Dynamic Theme System v2.0
 * ═══════════════════════════════
 * Theme Preference Spec v1.0: System default / Always light / Always dark.
 *  - "auto" follows iOS/Android system dark mode
 *  - Persists per user via AsyncStorage
 *  - Immediate apply — no restart required
 *
 * v51 refactor: light + dark palettes moved to theme/palettes.ts; brand
 * values moved to theme/brand.ts. This file is now Provider + Context only.
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, radii, spacing, motion, gradients, sizes, grid, shadows } from './tokens';
import { dark, light, type Palette } from './palettes';
import { brandDark, brandLight } from './brand';

export type AppearancePreference = 'auto' | 'light' | 'dark';
export type ResolvedMode = 'light' | 'dark';

const STORAGE_KEY = 'echo.appearance.preference';

// ─── DynamicPalette adds runtime-only fields not in static palette ──────────
// (tabActivePlate, brandGradientBorder, elevatedShadow…). These vary by mode
// but are not part of the canonical token shape exported from tokens.ts.
export type DynamicPalette = Palette & {
  brandGradientBorder: readonly string[];
  tabActivePlate: string;
  tabActiveBorder: string;
  tabActiveIcon: string;
  tabInactiveIcon: string;
  elevatedShadow: object;
  cardShadow: object;
};

// ─── Resolved palettes ─────────────────────────────────────────────────────
const darkFull: DynamicPalette = {
  ...dark,
  brandGradientBorder: brandDark.gradientBorder,
  tabActivePlate: 'rgba(255,255,255,0.06)',
  tabActiveBorder: 'rgba(123,77,255,0.28)',
  tabActiveIcon: '#E2DEFF',
  tabInactiveIcon: 'rgba(255,255,255,0.38)',
  elevatedShadow: {},
  cardShadow: {},
};

const lightFull: DynamicPalette = {
  ...light,
  brandGradientBorder: brandLight.gradientBorder,
  tabActivePlate: 'rgba(91,63,217,0.08)',
  tabActiveBorder: 'rgba(91,63,217,0.18)',
  tabActiveIcon: brandLight.primary,
  tabInactiveIcon: 'rgba(21,24,33,0.38)',
  elevatedShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

// ─── Context ────────────────────────────────────────────────────────────────
type DynamicThemeContextValue = {
  preference: AppearancePreference;
  setPreference: (value: AppearancePreference) => void;
  resolvedMode: ResolvedMode;
  isDark: boolean;
  colors: DynamicPalette;
  typography: typeof typography;
  radii: typeof radii;
  spacing: typeof spacing;
  motion: typeof motion;
  gradients: typeof gradients;
  sizes: typeof sizes;
  grid: typeof grid;
  shadows: typeof shadows;
  statusBarStyle: 'light' | 'dark';
};

const DynamicThemeContext = createContext<DynamicThemeContextValue | undefined>(undefined);

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [preference, setPreferenceState] = useState<AppearancePreference>('auto');
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'auto' || stored === 'light' || stored === 'dark') {
        setPreferenceState(stored);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const setPreference = useCallback((value: AppearancePreference) => {
    setPreferenceState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {});
  }, []);

  // Resolve: auto → system, else explicit
  const resolvedMode = useMemo<ResolvedMode>(() => {
    if (preference === 'light') return 'light';
    if (preference === 'dark') return 'dark';
    // auto: follow system, default dark if system is null
    return systemScheme === 'light' ? 'light' : 'dark';
  }, [preference, systemScheme]);

  const isDark = resolvedMode === 'dark';

  const value = useMemo<DynamicThemeContextValue>(() => ({
    preference,
    setPreference,
    resolvedMode,
    isDark,
    colors: isDark ? darkFull : lightFull,
    typography,
    radii,
    spacing,
    motion,
    gradients,
    sizes,
    grid,
    shadows,
    statusBarStyle: isDark ? 'light' : 'dark',
  }), [preference, resolvedMode, isDark, setPreference]);

  // Don't render until preference is loaded (prevents flash)
  if (!loaded) return null;

  return <DynamicThemeContext.Provider value={value}>{children}</DynamicThemeContext.Provider>;
}

export function useDynamicTheme() {
  const context = useContext(DynamicThemeContext);
  if (!context) throw new Error('useDynamicTheme must be used inside DynamicThemeProvider');
  return context;
}

// ─── Convenience hook for just colors ───────────────────────────────────────
export function useThemeColors() {
  return useDynamicTheme().colors;
}
