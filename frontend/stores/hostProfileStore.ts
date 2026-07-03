/**
 * Host Profile Store
 * ══════════════════
 * Manages host activation flow + profile state.
 * Adds persistence + Echo Disk management for realistic host operations.
 */
import { create } from 'zustand';
import {
  type HostProfile,
  type HostAccessStatus,
  type HostActivationStep,
  type HostType,
  type EventTypeOption,
  type PayoutProfile,
  type PayoutStatus,
  type ActivationResult,
  type EchoDiskSlot,
  ACTIVATION_STEP_ORDER,
  evaluateActivation,
  getMissingActivationFields,
} from '../types/hostProfile';
import { useModeStore } from './modeStore';
import { getJSON, setJSON } from '../services/persistence';

const HOST_PROFILE_KEY = 'echo.host.profile.v2';

const INITIAL_PROFILE: HostProfile = {
  id: '',
  userId: '',
  hostAccessStatus: 'not_started',
  displayName: '',
  hostType: null,
  city: '',
  eventTypes: [],
  termsAccepted: false,
  onboardingCompleted: false,
};

const INITIAL_PAYOUT: PayoutProfile = {
  id: '',
  userId: '',
  provider: 'none',
  payoutStatus: 'not_started',
  chargesEnabled: false,
  payoutsEnabled: false,
  updatedAt: new Date().toISOString(),
};

const EMPTY_DISK = (slotId: 'primary' | 'backup'): EchoDiskSlot => ({
  slotId,
  nickname: slotId === 'primary' ? 'Main Door Disk' : 'Backup Door Disk',
  serialNumber: '',
  status: 'empty',
});

interface PersistedHostProfileState {
  profile: HostProfile;
  payout: PayoutProfile;
  emailVerified: boolean;
  phoneVerified: boolean;
  primaryDisk: EchoDiskSlot;
  backupDisk: EchoDiskSlot;
  doorModePasscode: string;
}

interface HostProfileState {
  profile: HostProfile;
  payout: PayoutProfile;
  activationStep: HostActivationStep;
  activationResult: ActivationResult | null;
  missingFields: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  primaryDisk: EchoDiskSlot;
  backupDisk: EchoDiskSlot;
  doorModePasscode: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startActivation: () => void;
  setActivationStep: (step: HostActivationStep) => void;
  getStepIndex: () => number;
  getProgress: () => number;
  canAdvanceFromStep: (step: HostActivationStep) => boolean;
  setDisplayName: (name: string) => void;
  setHostType: (type: HostType) => void;
  setCity: (city: string) => void;
  toggleEventType: (type: EventTypeOption) => void;
  acceptTerms: () => void;
  setEmailVerified: (v: boolean) => void;
  setPhoneVerified: (v: boolean) => void;
  isVerificationComplete: () => boolean;
  shouldSkipVerification: () => boolean;
  runActivation: () => ActivationResult;
  startPayoutSetup: () => void;
  completePayoutSetup: () => void;
  registerEchoDisk: (slotId: 'primary' | 'backup', payload: { serialNumber: string; nickname?: string }) => void;
  verifyEchoDisk: (slotId: 'primary' | 'backup') => void;
  clearEchoDisk: (slotId: 'primary' | 'backup') => void;
  setDoorModePasscode: (passcode: string) => void;
  clearDoorModePasscode: () => void;
  verifyDoorModePasscode: (passcode: string) => boolean;
  getHostAccessStatus: () => HostAccessStatus;
  isActivated: () => boolean;
}

const persistState = async (state: HostProfileState) => {
  const payload: PersistedHostProfileState = {
    profile: state.profile,
    payout: state.payout,
    emailVerified: state.emailVerified,
    phoneVerified: state.phoneVerified,
    primaryDisk: state.primaryDisk,
    backupDisk: state.backupDisk,
    doorModePasscode: state.doorModePasscode,
  };
  await setJSON(HOST_PROFILE_KEY, payload);
};

export const useHostProfileStore = create<HostProfileState>((set, get) => ({
  profile: { ...INITIAL_PROFILE },
  payout: { ...INITIAL_PAYOUT },
  activationStep: 'intro',
  activationResult: null,
  missingFields: [],
  emailVerified: true,
  phoneVerified: false,
  primaryDisk: EMPTY_DISK('primary'),
  backupDisk: EMPTY_DISK('backup'),
  doorModePasscode: '',
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const persisted = await getJSON<PersistedHostProfileState | null>(HOST_PROFILE_KEY, null);
    if (persisted) {
      set({
        profile: persisted.profile || { ...INITIAL_PROFILE },
        payout: persisted.payout || { ...INITIAL_PAYOUT },
        emailVerified: persisted.emailVerified ?? true,
        phoneVerified: persisted.phoneVerified ?? false,
        primaryDisk: persisted.primaryDisk || EMPTY_DISK('primary'),
        backupDisk: persisted.backupDisk || EMPTY_DISK('backup'),
        doorModePasscode: persisted.doorModePasscode || '',
        hydrated: true,
      });
      useModeStore.getState().updateHostInputs({
        hostAccessStatus: persisted.profile?.hostAccessStatus || 'not_started',
        payoutStatus: persisted.payout?.payoutStatus || 'not_started',
      });
      return;
    }
    set({ hydrated: true });
  },

  startActivation: () => {
    const s = get();
    if (s.profile.hostAccessStatus === 'not_started') {
      const nextProfile = {
        ...s.profile,
        id: `host_${Date.now()}`,
        hostAccessStatus: 'in_progress' as const,
      };
      set({ profile: nextProfile, activationStep: 'intro', activationResult: null });
      void persistState(get());
      useModeStore.getState().updateHostInputs({ hostAccessStatus: 'in_progress' });
    }
  },

  setActivationStep: (step) => set({ activationStep: step }),
  getStepIndex: () => ACTIVATION_STEP_ORDER.indexOf(get().activationStep),
  getProgress: () => ((ACTIVATION_STEP_ORDER.indexOf(get().activationStep) + 1) / ACTIVATION_STEP_ORDER.length) * 100,
  canAdvanceFromStep: (step) => {
    const s = get();
    switch (step) {
      case 'intro': return true;
      case 'basics': return s.profile.displayName.trim().length > 0 && s.profile.hostType !== null && s.profile.city.trim().length > 0 && s.profile.eventTypes.length > 0;
      case 'verification': return s.emailVerified && s.phoneVerified;
      case 'terms': return s.profile.termsAccepted;
      default: return false;
    }
  },

  setDisplayName: (name) => {
    set((s) => ({ profile: { ...s.profile, displayName: name } }));
    void persistState(get());
  },
  setHostType: (type) => {
    set((s) => ({ profile: { ...s.profile, hostType: type } }));
    void persistState(get());
  },
  setCity: (city) => {
    set((s) => ({ profile: { ...s.profile, city } }));
    void persistState(get());
  },
  toggleEventType: (type) => {
    set((s) => ({
      profile: {
        ...s.profile,
        eventTypes: s.profile.eventTypes.includes(type) ? s.profile.eventTypes.filter((t) => t !== type) : [...s.profile.eventTypes, type],
      },
    }));
    void persistState(get());
  },
  acceptTerms: () => {
    set((s) => ({ profile: { ...s.profile, termsAccepted: true } }));
    void persistState(get());
  },
  setEmailVerified: (v) => { set({ emailVerified: v }); void persistState(get()); },
  setPhoneVerified: (v) => { set({ phoneVerified: v }); void persistState(get()); },
  isVerificationComplete: () => get().emailVerified && get().phoneVerified,
  shouldSkipVerification: () => get().emailVerified && get().phoneVerified,

  runActivation: () => {
    const s = get();
    const result = evaluateActivation({
      emailVerified: s.emailVerified,
      phoneVerified: s.phoneVerified,
      displayName: s.profile.displayName,
      hostType: s.profile.hostType,
      city: s.profile.city,
      eventTypes: s.profile.eventTypes,
      termsAccepted: s.profile.termsAccepted,
      accountStatus: useModeStore.getState().accountStatus,
      riskStatus: useModeStore.getState().riskStatus,
    });
    const missing = getMissingActivationFields({
      emailVerified: s.emailVerified,
      phoneVerified: s.phoneVerified,
      displayName: s.profile.displayName,
      hostType: s.profile.hostType,
      city: s.profile.city,
      eventTypes: s.profile.eventTypes,
      termsAccepted: s.profile.termsAccepted,
      accountStatus: useModeStore.getState().accountStatus,
      riskStatus: useModeStore.getState().riskStatus,
    });
    const statusMap: Record<ActivationResult, HostAccessStatus> = {
      active: 'active', action_required: 'action_required', restricted: 'restricted', suspended: 'suspended',
    };
    const newStatus = statusMap[result];
    const now = new Date().toISOString();
    set({
      activationResult: result,
      missingFields: missing,
      profile: { ...s.profile, hostAccessStatus: newStatus, onboardingCompleted: result === 'active', activatedAt: result === 'active' ? now : undefined },
    });
    void persistState(get());
    useModeStore.getState().updateHostInputs({ hostAccessStatus: newStatus });
    if (result === 'active') {
      useModeStore.getState().enableMode('host');
      useModeStore.getState().setActiveMode('host');
    }
    return result;
  },

  startPayoutSetup: () => {
    set((s) => ({ payout: { ...s.payout, payoutStatus: 'incomplete' as PayoutStatus } }));
    void persistState(get());
  },
  completePayoutSetup: () => {
    const now = new Date().toISOString();
    set((s) => ({ payout: { ...s.payout, provider: 'stripe', payoutStatus: 'connected', chargesEnabled: true, payoutsEnabled: true, updatedAt: now } }));
    void persistState(get());
    useModeStore.getState().updateHostInputs({ payoutStatus: 'connected' });
  },

  registerEchoDisk: (slotId, payload) => {
    const now = new Date().toISOString();
    const next = { slotId, nickname: payload.nickname?.trim() || (slotId === 'primary' ? 'Main Door Disk' : 'Backup Door Disk'), serialNumber: payload.serialNumber.trim().toUpperCase(), status: 'registered' as const, lastVerifiedAt: now };
    if (slotId === 'primary') set({ primaryDisk: next }); else set({ backupDisk: next });
    void persistState(get());
  },
  verifyEchoDisk: (slotId) => {
    const current = slotId === 'primary' ? get().primaryDisk : get().backupDisk;
    const next = { ...current, status: current.serialNumber ? 'verified' as const : 'empty' as const, lastVerifiedAt: current.serialNumber ? new Date().toISOString() : current.lastVerifiedAt };
    if (slotId === 'primary') set({ primaryDisk: next }); else set({ backupDisk: next });
    void persistState(get());
  },
  clearEchoDisk: (slotId) => {
    if (slotId === 'primary') set({ primaryDisk: EMPTY_DISK('primary') }); else set({ backupDisk: EMPTY_DISK('backup') });
    void persistState(get());
  },

  setDoorModePasscode: (passcode) => {
    set({ doorModePasscode: passcode.trim() });
    void persistState(get());
  },
  clearDoorModePasscode: () => {
    set({ doorModePasscode: '' });
    void persistState(get());
  },
  verifyDoorModePasscode: (passcode) => get().doorModePasscode.trim() !== '' && passcode.trim() === get().doorModePasscode.trim(),

  getHostAccessStatus: () => get().profile.hostAccessStatus,
  isActivated: () => get().profile.hostAccessStatus === 'active',
}));

void useHostProfileStore.getState().hydrate();
