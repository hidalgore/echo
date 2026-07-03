/**
 * ECHO Onboarding — Local Persistence
 * ═══════════════════════════════════
 * Persists onboarding progress so returning incomplete users resume from the
 * last meaningful step. Single completion gate reuses the existing intro flag
 * (echo_has_seen_intro_v1) via the auth store — this module stores the granular
 * state only. (Decision 3A.)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent } from '../logging';
import { DEFAULT_ONBOARDING_STATE, type EchoOnboardingState } from './onboardingTypes';

export const ONBOARDING_STORAGE_KEYS = {
  state: 'ECHO_ONBOARDING_STATE_V1',
  completed: 'ECHO_ONBOARDING_COMPLETED_V1',
  skipped: 'ECHO_ONBOARDING_SKIPPED_V1',
  launchSource: 'ECHO_ONBOARDING_LAUNCH_SOURCE_V1',
  lastCompletedStep: 'ECHO_ONBOARDING_LAST_STEP_V1',
  eventEnergy: 'ECHO_EVENT_ENERGY_V1',
  selectedCity: 'ECHO_SELECTED_CITY_V1',
  guestSession: 'ECHO_GUEST_SESSION_V1',
  demoPassSeen: 'ECHO_DEMO_PASS_SEEN_V1',
  firstAction: 'ECHO_FIRST_ACTION_V1',
} as const;

export async function loadOnboardingState(): Promise<EchoOnboardingState> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.state);
    if (!raw) return { ...DEFAULT_ONBOARDING_STATE };
    const parsed = JSON.parse(raw) as Partial<EchoOnboardingState>;
    return {
      ...DEFAULT_ONBOARDING_STATE,
      ...parsed,
      permissions: { ...DEFAULT_ONBOARDING_STATE.permissions, ...(parsed.permissions ?? {}) },
      deviceCapabilities: {
        ...DEFAULT_ONBOARDING_STATE.deviceCapabilities,
        ...(parsed.deviceCapabilities ?? {}),
      },
      energy: { ...DEFAULT_ONBOARDING_STATE.energy, ...(parsed.energy ?? {}) },
    };
  } catch (e) {
    logEvent('onboarding.storage', 'load_failed', { error: String(e) }, 'warn');
    return { ...DEFAULT_ONBOARDING_STATE };
  }
}

export async function persistOnboardingState(state: EchoOnboardingState): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.state, JSON.stringify(state));
    if (state.lastCompletedStep) {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.lastCompletedStep, state.lastCompletedStep);
    }
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.launchSource, state.launchSource);
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.eventEnergy, JSON.stringify(state.energy));
    if (state.energy.city) {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.selectedCity, state.energy.city);
    }
  } catch (e) {
    logEvent('onboarding.storage', 'persist_failed', { error: String(e) }, 'warn');
  }
}

export async function markOnboardingSkipped(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.skipped, 'true');
  } catch {}
}

export async function recordFirstAction(action: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.firstAction, action);
  } catch {}
}

export async function resetOnboardingStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(ONBOARDING_STORAGE_KEYS));
  } catch (e) {
    logEvent('onboarding.storage', 'reset_failed', { error: String(e) }, 'warn');
  }
}
