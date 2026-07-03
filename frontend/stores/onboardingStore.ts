/**
 * ECHO Onboarding Store
 * ═════════════════════
 * Zustand store holding the central EchoOnboardingState. Persists after every
 * meaningful step (spec §7). Completion reuses the existing intro flag via the
 * auth store (decision 3A) so the app never double-gates first launch.
 */
import { create } from 'zustand';
import { AccessibilityInfo } from 'react-native';
import { useAuthStore } from './authStore';
import {
  DEFAULT_ONBOARDING_STATE,
  type EchoOnboardingState,
  type OnboardingLaunchSource,
  type OnboardingUserPath,
  type PermissionType,
  type PermissionState,
  type AccountState,
  type WalletCapabilityState,
  type EventEnergySelections,
  type FirstActionState,
} from '../services/onboarding/onboardingTypes';
import {
  loadOnboardingState,
  persistOnboardingState,
  recordFirstAction,
  resetOnboardingStorage,
} from '../services/onboarding/onboardingStorage';
import { trackOnboarding } from '../services/onboarding/onboardingAnalytics';
import {
  userPathFromLaunchSource,
  deriveRecommendationReadiness,
} from '../services/onboarding/onboardingStateMachine';

interface OnboardingStore {
  state: EchoOnboardingState;
  hydrated: boolean;

  initialize: () => Promise<void>;
  setLaunchSource: (source: OnboardingLaunchSource) => void;
  setUserPath: (path: OnboardingUserPath) => void;
  completeStep: (routeId: string) => void;
  skipStep: (routeId: string) => void;
  setPermission: (type: PermissionType, value: PermissionState) => void;
  setEnergy: (partial: Partial<EventEnergySelections>) => void;
  setAccount: (account: AccountState) => void;
  setWallet: (wallet: WalletCapabilityState) => void;
  setFirstAction: (action: FirstActionState) => void;
  completeOnboarding: () => Promise<void>;
  reset: () => Promise<void>;
}

function commit(set: (p: { state: EchoOnboardingState }) => void, next: EchoOnboardingState) {
  set({ state: next });
  void persistOnboardingState(next);
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  state: { ...DEFAULT_ONBOARDING_STATE },
  hydrated: false,

  initialize: async () => {
    const loaded = await loadOnboardingState();
    let reduceMotionEnabled = false;
    let screenReaderEnabled = false;
    try {
      reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    } catch {}

    const startedAt = loaded.startedAt ?? new Date().toISOString();
    const progress = loaded.progress === 'completed' ? 'completed' : loaded.lastCompletedStep ? 'resume_available' : 'in_progress';

    const next: EchoOnboardingState = {
      ...loaded,
      startedAt,
      progress,
      deviceCapabilities: { ...loaded.deviceCapabilities, reduceMotionEnabled, screenReaderEnabled },
    };
    set({ state: next, hydrated: true });
    trackOnboarding('onboarding_started', { launchSource: next.launchSource });
  },

  setLaunchSource: (source) => {
    const prev = get().state;
    const next: EchoOnboardingState = {
      ...prev,
      launchSource: source,
      userPath: userPathFromLaunchSource(source),
    };
    commit(set, next);
    trackOnboarding('onboarding_launch_source_detected', { launchSource: source });
  },

  setUserPath: (path) => {
    commit(set, { ...get().state, userPath: path });
    trackOnboarding('onboarding_path_selected', { userPath: path });
  },

  completeStep: (routeId) => {
    const prev = get().state;
    commit(set, { ...prev, lastCompletedStep: routeId, progress: 'in_progress' });
    trackOnboarding('onboarding_screen_completed', { screen: routeId });
  },

  skipStep: (routeId) => {
    commit(set, { ...get().state, lastCompletedStep: routeId });
    trackOnboarding('onboarding_screen_skipped', { screen: routeId });
  },

  setPermission: (type, value) => {
    const prev = get().state;
    commit(set, { ...prev, permissions: { ...prev.permissions, [type]: value } });
    if (value === 'granted') trackOnboarding('permission_granted', { permissionType: type });
    else if (value === 'denied') trackOnboarding('permission_denied', { permissionType: type });
    else if (value === 'explained') trackOnboarding('permission_explained', { permissionType: type });
    else if (value === 'requested') trackOnboarding('permission_requested', { permissionType: type });
  },

  setEnergy: (partial) => {
    const prev = get().state;
    const energy = { ...prev.energy, ...partial };
    const locationGranted = prev.permissions.location === 'granted';
    const next: EchoOnboardingState = {
      ...prev,
      energy,
      personalization: energy.interests.length > 0 ? 'event_energy_selected' : prev.personalization,
      recommendationReadiness: deriveRecommendationReadiness(energy, locationGranted),
    };
    commit(set, next);
    trackOnboarding('event_energy_selected', { recommendationReadiness: next.recommendationReadiness });
    if (partial.city) trackOnboarding('city_selected', {});
  },

  setAccount: (account) => {
    const prev = get().state;
    commit(set, { ...prev, account });
    if (account === 'guest' || account === 'anonymous_session') {
      trackOnboarding('guest_mode_selected', { isGuest: true });
    } else if (account === 'account_created') {
      trackOnboarding('account_created', { isGuest: false });
    }
  },

  setWallet: (wallet) => {
    const prev = get().state;
    commit(set, { ...prev, wallet, echoPass: wallet === 'pass_added' ? 'wallet_added' : prev.echoPass });
    if (wallet === 'pass_added') trackOnboarding('wallet_pass_added', {});
  },

  setFirstAction: (action) => {
    commit(set, { ...get().state, firstAction: action });
    void recordFirstAction(action);
    trackOnboarding('first_action_completed', { firstAction: action });
  },

  completeOnboarding: async () => {
    const prev = get().state;
    const next: EchoOnboardingState = {
      ...prev,
      progress: 'completed',
      personalization: prev.personalization === 'not_started' ? 'skipped' : 'complete',
      completedAt: new Date().toISOString(),
    };
    set({ state: next });
    await persistOnboardingState(next);
    // Single completion gate: flip the existing intro flag (decision 3A).
    await useAuthStore.getState().markIntroSeen();
    trackOnboarding('onboarding_completed', {
      isGuest: prev.account === 'guest' || prev.account === 'anonymous_session',
      recommendationReadiness: next.recommendationReadiness,
    });
  },

  reset: async () => {
    await resetOnboardingStorage();
    set({ state: { ...DEFAULT_ONBOARDING_STATE }, hydrated: true });
  },
}));
