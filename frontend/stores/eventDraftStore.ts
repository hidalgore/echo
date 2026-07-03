/**
 * Event Draft Store
 * ═════════════════
 * Manages create event form state across 4 steps:
 * Basics → Ticketing → Details → Review
 * Autosaves on every field update.
 */
import { create } from 'zustand';
import { isEventDetailVideoDurationAllowed } from '../constants/eventMedia';
import type { AccessTierId, GuestAccessPolicy, RefundPolicy, ScheduledPublishConfig } from '../types/v3';
import { DEFAULT_GUEST_ACCESS_POLICY } from '../types/v3';
import { createRefundPolicy, migrateLegacyRefundFlag } from '../services/refundPolicyEngine';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateEventStep = 'basics' | 'ticketing' | 'details' | 'review';

export const STEP_ORDER: CreateEventStep[] = ['basics', 'ticketing', 'details', 'review'];

export type TicketingModel = 'free' | 'paid';

export type AgeRestriction = 'all_ages' | '18+' | '21+';

export const AGE_OPTIONS: { value: AgeRestriction; label: string }[] = [
  { value: 'all_ages', label: 'All Ages' },
  { value: '18+', label: '18+' },
  { value: '21+', label: '21+' },
];

export const CATEGORY_OPTIONS = [
  'Music', 'Nightlife', 'Food & Drink', 'Arts & Culture',
  'Sports', 'Comedy', 'Networking', 'Wellness', 'Community', 'Other',
] as const;

export type EventCategory = (typeof CATEGORY_OPTIONS)[number];

export interface DonationImpactLabelDraft {
  amount: number;
  label: string;
}

export interface DonationCampaignDraft {
  enabled: boolean;
  causeTitle: string;
  causeDescription: string;
  goalAmount: number;
  suggestedAmounts: number[];
  impactLabels: DonationImpactLabelDraft[];
  publicPageEnabled: boolean;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  salesStart: string; // ISO date
  salesEnd: string;   // ISO date
  /** ECHO Access Pass tier lock. Defaults to General Admission. */
  accessTierId: AccessTierId;
  /** Optional host-facing description shown on Event Details + checkout. */
  accessTierDescription?: string;
}

export const MAX_CATEGORIES = 3;

export interface EventDraftForm {
  // Basics
  title: string;
  categories: EventCategory[];
  venue: string;
  city: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;
  ageRestriction: AgeRestriction;
  // Ticketing
  ticketingModel: TicketingModel;
  tickets: TicketTier[];
  /** @deprecated Use `refundPolicy` (V3). Kept for migration window. */
  allowRefunds: boolean;
  allowTransfers: boolean;
  // V3 — Refund policy (R6, 6C, 7A). Migrates from `allowRefunds` boolean via
  // services/refundPolicyEngine::migrateLegacyRefundFlag. Default: 'balanced'.
  refundPolicy: RefundPolicy;
  // V3 — 3-date scheduling model (2C, R4). publishDate and salesStartDate are
  // optional during the migration window; new events default both to event date.
  // salesStartDate is the event-level floor for per-tier sales windows.
  publishDate?: string;       // ISO datetime — when event becomes publicly discoverable
  salesStartDate?: string;    // ISO datetime — when tickets become buyable (may precede publishDate for presale)
  /** Scheduled Publish upgrade: host can publish setup now while public launch waits until selected date. */
  scheduledPublish?: ScheduledPublishConfig;
  // Details
  description: string;
  /** Static cover/flyer used on Home, discovery, wallet thumbnails, and all card surfaces. */
  coverImageUri: string;
  /** Optional Event Details hero media. May be a photo or video; never used on Home cards. */
  eventDetailMediaUri: string;
  eventDetailMediaType: 'image' | 'video' | null;
  /** Locked policy: Event Details videos may not exceed 30 seconds. */
  eventDetailMediaDurationSeconds: number | null;
  notes: string;
  donationCampaign: DonationCampaignDraft;
  /** Guest Access Control lock: host can deny/hold/flag guests with reasons and audit trail. */
  guestAccessPolicy: GuestAccessPolicy;
}

const EMPTY_TICKET: TicketTier = {
  id: 'tier_1',
  name: 'General Admission',
  price: 0,
  quantity: 100,
  salesStart: '',
  salesEnd: '',
  accessTierId: 'general_admission',
};


const EMPTY_DONATION_CAMPAIGN: DonationCampaignDraft = {
  enabled: false,
  causeTitle: '',
  causeDescription: '',
  goalAmount: 0,
  suggestedAmounts: [5, 10, 25],
  impactLabels: [
    { amount: 5, label: 'Supports supplies' },
    { amount: 10, label: 'Supports programming' },
    { amount: 25, label: 'Contributes to the goal' },
  ],
  publicPageEnabled: true,
};

const EMPTY_DRAFT: EventDraftForm = {
  title: '',
  categories: [],
  venue: '',
  city: '',
  date: '',
  startTime: '',
  endTime: '',
  ageRestriction: 'all_ages',
  ticketingModel: 'free',
  tickets: [{ ...EMPTY_TICKET }],
  allowRefunds: false,
  allowTransfers: false,
  // V3 — default to 'balanced' refund preset (R6)
  refundPolicy: createRefundPolicy('balanced'),
  publishDate: undefined,
  salesStartDate: undefined,
  scheduledPublish: undefined,
  description: '',
  coverImageUri: '',
  eventDetailMediaUri: '',
  eventDetailMediaType: null,
  eventDetailMediaDurationSeconds: null,
  notes: '',
  donationCampaign: { ...EMPTY_DONATION_CAMPAIGN, impactLabels: EMPTY_DONATION_CAMPAIGN.impactLabels.map((label) => ({ ...label })) },
  guestAccessPolicy: { ...DEFAULT_GUEST_ACCESS_POLICY },
};

// ─── Store ──────────────────────────────────────────────────────────────────

interface EventDraftState {
  draft: EventDraftForm;
  step: CreateEventStep;
  isDirty: boolean;

  // ── Step navigation ──
  setStep: (step: CreateEventStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  getStepIndex: () => number;
  getProgress: () => number;
  canAdvance: () => boolean;

  // ── Field updates ──
  updateField: <K extends keyof EventDraftForm>(key: K, value: EventDraftForm[K]) => void;
  setTitle: (v: string) => void;
  toggleCategory: (v: EventCategory) => void;
  setVenue: (v: string) => void;
  setCity: (v: string) => void;
  setDate: (v: string) => void;
  setStartTime: (v: string) => void;
  setEndTime: (v: string) => void;
  setAgeRestriction: (v: AgeRestriction) => void;
  setTicketingModel: (v: TicketingModel) => void;
  setAllowRefunds: (v: boolean) => void;
  setAllowTransfers: (v: boolean) => void;
  // V3 setters (R4, R6)
  setRefundPolicy: (policy: RefundPolicy) => void;
  setPublishDate: (date: string | undefined) => void;
  setSalesStartDate: (date: string | undefined) => void;
  setScheduledPublish: (config: ScheduledPublishConfig | undefined) => void;
  setDescription: (v: string) => void;
  setCoverImageUri: (v: string) => void;
  setEventDetailMedia: (uri: string, type: 'image' | 'video' | null, durationSeconds?: number | null) => void;
  setNotes: (v: string) => void;
  updateDonationCampaign: (updates: Partial<DonationCampaignDraft>) => void;
  updateGuestAccessPolicy: (updates: Partial<GuestAccessPolicy>) => void;
  updateDonationImpactLabel: (amount: number, label: string) => void;

  // ── Ticket tier management ──
  updateTicket: (tierId: string, updates: Partial<TicketTier>) => void;
  addTicketTier: () => void;
  removeTicketTier: (tierId: string) => void;

  // ── Validation ──
  getBasicsComplete: () => boolean;
  getTicketingComplete: () => boolean;
  getDetailsComplete: () => boolean;
  isPublishReady: () => boolean;
  getReadinessFields: () => Record<string, boolean>;

  // ── Lifecycle ──
  resetDraft: () => void;
  loadFromEvent: (source: Partial<EventDraftForm>) => void;
}

export const useEventDraftStore = create<EventDraftState>((set, get) => ({
  draft: { ...EMPTY_DRAFT },
  step: 'basics',
  isDirty: false,

  // ── Step navigation ────────────────────────────────────────────────────

  setStep: (step) => set({ step }),

  nextStep: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    if (idx < STEP_ORDER.length - 1) set({ step: STEP_ORDER[idx + 1] });
  },

  prevStep: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    if (idx > 0) set({ step: STEP_ORDER[idx - 1] });
  },

  getStepIndex: () => STEP_ORDER.indexOf(get().step),

  getProgress: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    return ((idx + 1) / STEP_ORDER.length) * 100;
  },

  canAdvance: () => {
    const s = get();
    switch (s.step) {
      case 'basics': return s.getBasicsComplete();
      case 'ticketing': return s.getTicketingComplete();
      case 'details': return true; // details are optional
      case 'review': return s.isPublishReady();
      default: return false;
    }
  },

  // ── Field updates ─────────────────────────────────────────────────────

  updateField: (key, value) =>
    set((s) => ({ draft: { ...s.draft, [key]: value }, isDirty: true })),

  setTitle: (v) => get().updateField('title', v),
  toggleCategory: (v) => {
    const current = get().draft.categories;
    if (current.includes(v)) {
      // Remove
      get().updateField('categories', current.filter((c) => c !== v));
    } else if (current.length < MAX_CATEGORIES) {
      // Add (up to max)
      get().updateField('categories', [...current, v]);
    }
    // If already at max and trying to add a new one, ignore
  },
  setVenue: (v) => get().updateField('venue', v),
  setCity: (v) => get().updateField('city', v),
  setDate: (v) => get().updateField('date', v),
  setStartTime: (v) => get().updateField('startTime', v),
  setEndTime: (v) => get().updateField('endTime', v),
  setAgeRestriction: (v) => get().updateField('ageRestriction', v),
  setTicketingModel: (v) => get().updateField('ticketingModel', v),
  setAllowRefunds: (v) => {
    // Backward-compat: also sync refundPolicy via migration helper (R6)
    get().updateField('allowRefunds', v);
    get().updateField('refundPolicy', migrateLegacyRefundFlag(v));
  },
  setAllowTransfers: (v) => get().updateField('allowTransfers', v),
  // V3 setters
  setRefundPolicy: (policy) => {
    // Sync deprecated allowRefunds for any legacy consumers in the migration window
    const allow = policy.tiers.some((t) => t.refundPct > 0);
    set((s) => ({
      draft: { ...s.draft, refundPolicy: policy, allowRefunds: allow },
      isDirty: true,
    }));
  },
  setPublishDate: (date) => get().updateField('publishDate', date),
  setSalesStartDate: (date) => get().updateField('salesStartDate', date),
  setScheduledPublish: (config) => get().updateField('scheduledPublish', config),
  setDescription: (v) => get().updateField('description', v),
  setCoverImageUri: (v) => get().updateField('coverImageUri', v),
  setEventDetailMedia: (uri, type, durationSeconds = null) =>
    set((state) => ({
      draft: {
        ...state.draft,
        eventDetailMediaUri: uri,
        eventDetailMediaType: type,
        eventDetailMediaDurationSeconds: type === 'video' ? durationSeconds : null,
      },
      isDirty: true,
    })),
  setNotes: (v) => get().updateField('notes', v),
  updateDonationCampaign: (updates) =>
    set((s) => ({
      draft: { ...s.draft, donationCampaign: { ...s.draft.donationCampaign, ...updates } },
      isDirty: true,
    })),
  updateGuestAccessPolicy: (updates) =>
    set((s) => ({
      draft: { ...s.draft, guestAccessPolicy: { ...s.draft.guestAccessPolicy, ...updates } },
      isDirty: true,
    })),

  updateDonationImpactLabel: (amount, label) =>
    set((s) => ({
      draft: {
        ...s.draft,
        donationCampaign: {
          ...s.draft.donationCampaign,
          impactLabels: s.draft.donationCampaign.impactLabels.map((item) =>
            item.amount === amount ? { ...item, label } : item
          ),
        },
      },
      isDirty: true,
    })),

  // ── Ticket tier management ────────────────────────────────────────────

  updateTicket: (tierId, updates) =>
    set((s) => ({
      draft: {
        ...s.draft,
        tickets: s.draft.tickets.map((t) =>
          t.id === tierId ? { ...t, ...updates } : t
        ),
      },
      isDirty: true,
    })),

  addTicketTier: () =>
    set((s) => {
      const next = s.draft.tickets.length + 1;
      return {
        draft: {
          ...s.draft,
          tickets: [
            ...s.draft.tickets,
            { id: `tier_${next}`, name: '', price: 0, quantity: 50, salesStart: '', salesEnd: '', accessTierId: 'general_admission' },
          ],
        },
        isDirty: true,
      };
    }),

  removeTicketTier: (tierId) =>
    set((s) => ({
      draft: {
        ...s.draft,
        tickets: s.draft.tickets.filter((t) => t.id !== tierId),
      },
      isDirty: true,
    })),

  // ── Validation ────────────────────────────────────────────────────────

  getBasicsComplete: () => {
    const d = get().draft;
    return (
      d.title.trim().length > 0 &&
      d.categories.length > 0 &&
      d.venue.trim().length > 0 &&
      d.date.trim().length > 0 &&
      d.startTime.trim().length > 0
    );
  },

  getTicketingComplete: () => {
    const d = get().draft;
    if (d.ticketingModel === 'free') return true;
    return d.tickets.every(
      (t) => t.name.trim().length > 0 && t.price > 0 && t.quantity > 0
    );
  },

  getDetailsComplete: () => {
    const d = get().draft;
    return d.description.trim().length > 0;
  },

  isPublishReady: () => {
    const s = get();
    const donation = s.draft.donationCampaign;
    const donationReady = !donation.enabled || (
      donation.causeTitle.trim().length > 0 &&
      donation.causeDescription.trim().length > 0 &&
      donation.goalAmount > 0
    );
    const eventDetailsMediaReady = !s.draft.eventDetailMediaUri || (
      !!s.draft.eventDetailMediaType &&
      (s.draft.eventDetailMediaType !== 'video' || isEventDetailVideoDurationAllowed(s.draft.eventDetailMediaDurationSeconds))
    );
    return s.getBasicsComplete() && s.getTicketingComplete() && donationReady && eventDetailsMediaReady;
  },

  getReadinessFields: () => {
    const s = get();
    const d = s.draft;
    return {
      title: d.title.trim().length > 0,
      description: d.description.trim().length > 0,
      tickets: s.getTicketingComplete(),
      accessTiers: d.tickets.every((t) => !!t.accessTierId),
      donation: !d.donationCampaign.enabled || (d.donationCampaign.causeTitle.trim().length > 0 && d.donationCampaign.causeDescription.trim().length > 0 && d.donationCampaign.goalAmount > 0),
      image: d.coverImageUri.length > 0,
      eventDetailsMedia: !d.eventDetailMediaUri || (
        !!d.eventDetailMediaType &&
        (d.eventDetailMediaType !== 'video' || isEventDetailVideoDurationAllowed(d.eventDetailMediaDurationSeconds))
      ),
      payout: d.ticketingModel === 'free' || false, // Will check from hostProfileStore
    };
  },

  // ── Lifecycle ─────────────────────────────────────────────────────────

  resetDraft: () => set({ draft: { ...EMPTY_DRAFT, donationCampaign: { ...EMPTY_DONATION_CAMPAIGN, impactLabels: EMPTY_DONATION_CAMPAIGN.impactLabels.map((label) => ({ ...label })) }, guestAccessPolicy: { ...DEFAULT_GUEST_ACCESS_POLICY } }, step: 'basics', isDirty: false }),

  loadFromEvent: (source) => set({
    draft: {
      ...EMPTY_DRAFT,
      ...source,
      date: source.date || '',
      startTime: source.startTime || '',
      endTime: source.endTime || '',
      coverImageUri: source.coverImageUri || '',
      eventDetailMediaUri: source.eventDetailMediaUri || source.coverImageUri || '',
      eventDetailMediaType: source.eventDetailMediaType || (source.coverImageUri ? 'image' : null),
      eventDetailMediaDurationSeconds: source.eventDetailMediaDurationSeconds || null,
      donationCampaign: source.donationCampaign || { ...EMPTY_DONATION_CAMPAIGN, impactLabels: EMPTY_DONATION_CAMPAIGN.impactLabels.map((label) => ({ ...label })) },
      guestAccessPolicy: source.guestAccessPolicy || { ...DEFAULT_GUEST_ACCESS_POLICY },
      // V3 migration (R6): if source carries refundPolicy use it; else derive from allowRefunds
      refundPolicy: source.refundPolicy
        ?? (source.allowRefunds != null
          ? migrateLegacyRefundFlag(source.allowRefunds)
          : createRefundPolicy('balanced')),
      // V3 dates pass through if present
      publishDate: source.publishDate,
      salesStartDate: source.salesStartDate,
      scheduledPublish: source.scheduledPublish,
      // Reset ticket IDs for new tiers
      tickets: (source.tickets || EMPTY_DRAFT.tickets).map((t, i) => ({
        ...t,
        id: `tier_dup_${i + 1}`,
        salesStart: t.salesStart || '',
        salesEnd: t.salesEnd || '',
        accessTierId: t.accessTierId || 'general_admission',
      })),
    },
    step: 'basics',
    isDirty: true,
  }),
}));
