/**
 * V3 Event Creation Store
 * ═══════════════════════
 * Manages the V3 Flyer-First creation flow state machine.
 * Coexists with the manual eventDraftStore (which V3 spec preserves as
 * the "Start From Scratch" secondary path per 1A + R1).
 *
 * V3 flow: entry → upload → scan → review → health → pulse → schedule → launch
 *
 * Locks: 1B (Edge Function), 1C (hard-block), 4B (<70% threshold), 2A (unified
 * Flyer Score), 2C (3-date scheduling), 3B (4 publish gates), 5A/9A (ESS).
 */

import { create } from 'zustand';

import type {
  EventSchedule,
  GuestAccessPolicy,
  PresaleInvite,
  PublishReadiness,
  PublishReadinessGate,
  V3ExtractedField,
  V3ExtractionResult,
  ScheduledPublishConfig,
  ScheduledPublishValidationResult,
  V3FlowStep,
} from '../types/v3';
import {
  CONFIDENCE_HARD_BLOCK_THRESHOLD,
  FLYER_SCORE_PUBLISH_FLOOR,
  V3_STEP_ORDER,
  DEFAULT_GUEST_ACCESS_POLICY,
} from '../types/v3';
import { validateScheduledPublish } from '../services/scheduledPublishService';

// ─── State Shape ────────────────────────────────────────────────────────────

interface V3EventCreationState {
  // ── Flow position ──
  step: V3FlowStep;

  // ── Flyer + extraction ──
  flyerUri: string | null;
  flyerMimeType: string | null;
  flyerSizeBytes: number | null;
  extraction: V3ExtractionResult | null;
  scanInProgress: boolean;
  scanError: string | null;

  // ── Schedule + presale ──
  schedule: EventSchedule | null;
  scheduledPublish: ScheduledPublishConfig | null;
  scheduledPublishValidation: ScheduledPublishValidationResult | null;
  presaleEnabled: boolean;
  presaleInvites: PresaleInvite[];

  // ── Publish readiness inputs ──
  /** Whether host has set a refund policy preset for this event */
  refundPolicySet: boolean;
  /** Whether host has positively declared an age tier (incl. "none") */
  ageVerificationDeclared: boolean;
  /** Account-level NFC readiness — derived from host profile, set externally */
  nfcConfigReady: boolean;
  /** Per-event door check-in method declaration (6B) */
  doorModeMethodDeclared: boolean;
  guestAccessPolicy: GuestAccessPolicy;

  // ── Actions ──
  setStep: (step: V3FlowStep) => void;
  advance: () => void;
  goBack: () => void;
  goToStep: (step: V3FlowStep) => void;

  setFlyerFile: (uri: string, mimeType?: string, sizeBytes?: number) => void;
  clearFlyer: () => void;

  setScanInProgress: (inProgress: boolean) => void;
  setScanError: (error: string | null) => void;
  setExtraction: (result: V3ExtractionResult) => void;

  confirmField: (key: string) => void;
  updateField: (key: string, value: string) => void;

  setSchedule: (schedule: EventSchedule) => void;
  setScheduledPublish: (config: ScheduledPublishConfig) => void;
  setPresaleEnabled: (enabled: boolean) => void;
  addPresaleInvite: (invite: PresaleInvite) => void;
  removePresaleInvite: (inviteToken: string) => void;

  setRefundPolicySet: (set: boolean) => void;
  setAgeVerificationDeclared: (declared: boolean) => void;
  setNfcConfigReady: (ready: boolean) => void;
  setDoorModeMethodDeclared: (declared: boolean) => void;
  updateGuestAccessPolicy: (updates: Partial<GuestAccessPolicy>) => void;

  // ── Derived ──
  getLowConfidenceFields: () => V3ExtractedField[];
  getUnconfirmedLowConfidenceFields: () => V3ExtractedField[];
  canAdvanceFromReview: () => boolean;
  getPublishReadiness: () => PublishReadiness;
  getScheduledPublishValidation: () => ScheduledPublishValidationResult | null;
  isFlyerScorePublishReady: () => boolean;

  // ── Lifecycle ──
  reset: () => void;
}

// ─── Initial State ──────────────────────────────────────────────────────────

const INITIAL_STATE: Omit<
  V3EventCreationState,
  // Actions/derived — omitted from initial state
  | 'setStep' | 'advance' | 'goBack' | 'goToStep'
  | 'setFlyerFile' | 'clearFlyer'
  | 'setScanInProgress' | 'setScanError' | 'setExtraction'
  | 'confirmField' | 'updateField'
  | 'setSchedule' | 'setScheduledPublish' | 'setPresaleEnabled' | 'addPresaleInvite' | 'removePresaleInvite'
  | 'setRefundPolicySet' | 'setAgeVerificationDeclared' | 'setNfcConfigReady' | 'setDoorModeMethodDeclared' | 'updateGuestAccessPolicy'
  | 'getLowConfidenceFields' | 'getUnconfirmedLowConfidenceFields'
  | 'canAdvanceFromReview' | 'getPublishReadiness' | 'getScheduledPublishValidation' | 'isFlyerScorePublishReady'
  | 'reset'
> = {
  step: 'entry',
  flyerUri: null,
  flyerMimeType: null,
  flyerSizeBytes: null,
  extraction: null,
  scanInProgress: false,
  scanError: null,
  schedule: null,
  scheduledPublish: null,
  scheduledPublishValidation: null,
  presaleEnabled: false,
  presaleInvites: [],
  refundPolicySet: false,
  ageVerificationDeclared: false,
  nfcConfigReady: false,
  doorModeMethodDeclared: false,
  guestAccessPolicy: { ...DEFAULT_GUEST_ACCESS_POLICY },
};

// ─── Store Definition ───────────────────────────────────────────────────────

export const useV3EventCreationStore = create<V3EventCreationState>((set, get) => ({
  ...INITIAL_STATE,

  // ── Flow navigation ──

  setStep: (step) => set({ step }),

  advance: () => {
    const idx = V3_STEP_ORDER.indexOf(get().step);
    if (idx >= 0 && idx < V3_STEP_ORDER.length - 1) {
      set({ step: V3_STEP_ORDER[idx + 1] });
    }
  },

  goBack: () => {
    const idx = V3_STEP_ORDER.indexOf(get().step);
    if (idx > 0) {
      set({ step: V3_STEP_ORDER[idx - 1] });
    }
  },

  goToStep: (step) => set({ step }),

  // ── Flyer file ──

  setFlyerFile: (uri, mimeType, sizeBytes) =>
    set({
      flyerUri: uri,
      flyerMimeType: mimeType ?? null,
      flyerSizeBytes: sizeBytes ?? null,
      scanError: null,
    }),

  clearFlyer: () =>
    set({
      flyerUri: null,
      flyerMimeType: null,
      flyerSizeBytes: null,
      extraction: null,
      scanError: null,
    }),

  // ── Scan state ──

  setScanInProgress: (inProgress) =>
    set({ scanInProgress: inProgress, scanError: inProgress ? null : get().scanError }),

  setScanError: (error) => set({ scanError: error, scanInProgress: false }),

  setExtraction: (result) =>
    set({ extraction: result, scanInProgress: false, scanError: null }),

  // ── Field-level ──

  confirmField: (key) => {
    const ex = get().extraction;
    if (!ex) return;
    set({
      extraction: {
        ...ex,
        fields: ex.fields.map((f) => (f.key === key ? { ...f, hostConfirmed: true } : f)),
      },
    });
  },

  updateField: (key, value) => {
    const ex = get().extraction;
    if (!ex) return;
    set({
      extraction: {
        ...ex,
        fields: ex.fields.map((f) =>
          f.key === key ? { ...f, value, hostConfirmed: true } : f,
        ),
      },
    });
  },

  // ── Schedule + presale ──

  setSchedule: (schedule) => set({ schedule }),

  setScheduledPublish: (config) => {
    const validation = validateScheduledPublish(config);
    set({ scheduledPublish: config, schedule: config, scheduledPublishValidation: validation });
  },

  setPresaleEnabled: (enabled) => set({ presaleEnabled: enabled }),

  addPresaleInvite: (invite) =>
    set((s) => ({ presaleInvites: [...s.presaleInvites, invite] })),

  removePresaleInvite: (inviteToken) =>
    set((s) => ({
      presaleInvites: s.presaleInvites.filter((i) => i.inviteToken !== inviteToken),
    })),

  // ── Readiness inputs ──

  setRefundPolicySet: (v) => set({ refundPolicySet: v }),
  setAgeVerificationDeclared: (v) => set({ ageVerificationDeclared: v }),
  setNfcConfigReady: (v) => set({ nfcConfigReady: v }),
  setDoorModeMethodDeclared: (v) => set({ doorModeMethodDeclared: v }),
  updateGuestAccessPolicy: (updates) =>
    set((s) => ({ guestAccessPolicy: { ...s.guestAccessPolicy, ...updates } })),

  // ── Derived ──

  getLowConfidenceFields: () => {
    const ex = get().extraction;
    if (!ex) return [];
    return ex.fields.filter((f) => f.confidence < CONFIDENCE_HARD_BLOCK_THRESHOLD);
  },

  getUnconfirmedLowConfidenceFields: () => {
    const ex = get().extraction;
    if (!ex) return [];
    return ex.fields.filter(
      (f) => f.confidence < CONFIDENCE_HARD_BLOCK_THRESHOLD && !f.hostConfirmed,
    );
  },

  /** Lock 1C — Review step can advance only when all low-confidence fields are confirmed */
  canAdvanceFromReview: () => get().getUnconfirmedLowConfidenceFields().length === 0,

  getScheduledPublishValidation: () => {
    const s = get();
    if (!s.scheduledPublish) return null;
    return s.scheduledPublishValidation ?? validateScheduledPublish(s.scheduledPublish);
  },

  isFlyerScorePublishReady: () => {
    const ex = get().extraction;
    if (!ex) return false;
    return ex.flyerScore.total >= FLYER_SCORE_PUBLISH_FLOOR;
  },

  /** Lock 3B + R5 — All 4 hard gates AND Flyer Score >= 80 */
  getPublishReadiness: (): PublishReadiness => {
    const s = get();
    const flyerScore = s.extraction?.flyerScore.total ?? 0;

    const gates: PublishReadinessGate[] = [
      {
        id: 'refund_policy',
        label: 'Refund Policy',
        ready: s.refundPolicySet,
        reason: s.refundPolicySet ? undefined : 'Choose a refund preset.',
      },
      {
        id: 'age_verification',
        label: 'Age Verification',
        ready: s.ageVerificationDeclared,
        reason: s.ageVerificationDeclared ? undefined : 'Declare age tier (None / 18+ / 21+).',
      },
      {
        id: 'nfc_config',
        label: 'NFC',
        ready: s.nfcConfigReady,
        reason: s.nfcConfigReady ? undefined : 'Register at least 1 NFC device to your host account.',
      },
      {
        id: 'door_mode',
        label: 'Door Mode',
        ready: s.doorModeMethodDeclared,
        reason: s.doorModeMethodDeclared ? undefined : 'Pick a door check-in method for this event.',
      },
    ];

    const gatesReady = gates.every((g) => g.ready);
    const flyerScoreReady = flyerScore >= FLYER_SCORE_PUBLISH_FLOOR;
    const scheduleValidation = s.getScheduledPublishValidation();

    return {
      ready: gatesReady && flyerScoreReady && (scheduleValidation?.valid ?? true),
      gates,
      flyerScore,
      flyerScoreThreshold: FLYER_SCORE_PUBLISH_FLOOR,
      flyerScoreReady,
    };
  },

  // ── Lifecycle ──

  reset: () => set({ ...INITIAL_STATE }),
}));
