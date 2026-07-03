import type { AccessTierId, GuestAccessPolicy, ScheduledPublishConfig, V3EventState } from './v3';

/**
 * ECHO Host Events — Type Definitions
 * Canonical types for host event management and event creation flow.
 */


// ─── Host Event Types ────────────────────────────────────────────────

/**
 * V3 canonical lifecycle states (R3 migration).
 * Legacy aliases preserved for backward compatibility for one release cycle.
 *
 *   v59.3 → V3 canonical
 *   upcoming → scheduled
 *   live     → published
 *   past     → ended
 *   closed   → cancelled
 *   (NEW)    → paused (host pause of ticket sales)
 *   (NEW)    → cancelled (distinct from ended)
 */
// V3EventState is the single canonical definition in ./v3 (collapsed per Phase-2 audit
// to prevent divergence). Re-exported here so existing importers of hostEvents keep working.
export type { V3EventState };

/** Legacy alias — accepts both v59.3 and V3 state strings during migration window */
export type HostEventStatus =
  | V3EventState
  // Backward-compat aliases (deprecated, removed in V3.1)
  | 'live'
  | 'upcoming'
  | 'past'
  | 'closed';

/** Map legacy status → V3 canonical state */
export function normalizeEventStatus(status: HostEventStatus): V3EventState {
  switch (status) {
    case 'upcoming': return 'scheduled';
    case 'live': return 'published';
    case 'past': return 'ended';
    case 'closed': return 'cancelled';
    default: return status;
  }
}

export type HealthLabel =
  | 'Selling Well'
  | 'Slow Sales'
  | 'Near Capacity'
  | 'Draft'
  | 'Completed';

export type AgeRequirement = 'All Ages' | '18+' | '21+';

export type EventVisibility = 'public' | 'private' | 'invite_only';

export type EventCategory =
  | 'Music'
  | 'Nightlife'
  | 'Culture'
  | 'Food & Drink'
  | 'Tech'
  | 'Sports'
  | 'Comedy'
  | 'Art'
  | 'Community'
  | 'Wellness'
  | 'Networking'
  | 'Other';

export type HostEvent = {
  id: string;
  title: string;
  venue: string;
  city?: string;
  date: string;
  time: string;
  status: HostEventStatus;
  flyerImage?: string;
  eventDetailMediaUri?: string;
  eventDetailMediaType?: 'image' | 'video';
  /** Required when Event Details media is video. Locked maximum: 30 seconds. */
  eventDetailMediaDurationSeconds?: number | null;
  ticketsSold: number;
  /** Canonical event credential language: ECHO Access Passes. */
  accessPassesIssued?: number;
  checkedIn: number;
  capacity: number;
  revenue: number;
  projectedGuests?: number;
  healthLabel?: HealthLabel;
  ageRequirement?: AgeRequirement;
  isPublic?: boolean;
  escrowPending?: number;
  doorBreakdown?: {
    main: number;
    vip: number;
    back: number;
    denied?: number;
    duplicateBlocked?: number;
  };
  scheduledPublish?: ScheduledPublishConfig;
  guestAccessPolicy?: GuestAccessPolicy;
  enabledAccessTiers?: AccessTierId[];
};

// ─── Event Draft / Creation Types ────────────────────────────────────

export type EventDraft = {
  id: string;
  flyerImage?: string;
  /** Optional media shown only on the public Event Details hero. Home keeps flyerImage as the still card image. */
  eventDetailMediaUri?: string;
  eventDetailMediaType?: 'image' | 'video';
  /** Required when Event Details media is video. Locked maximum: 30 seconds. */
  eventDetailMediaDurationSeconds?: number | null;
  title: string;
  venue: string;
  date: string;
  startTime: string;
  endTime?: string;
  doorsOpenTime?: string;
  price: number;
  capacity: number;
  /** Default access tier used when creating the first Access Pass tier. */
  defaultAccessTierId?: AccessTierId;
  ageRequirement: AgeRequirement;
  visibility: EventVisibility;
  category?: EventCategory;
  description?: string;
  extractionConfidence?: number;
  extractionIssues?: string[];
  suggestedDescription?: string;
  suggestedPriceRange?: { min: number; max: number };
  suggestedCapacityRange?: { min: number; max: number };
  advancedEditRequired?: boolean;
  scheduledPublish?: ScheduledPublishConfig;
  guestAccessPolicy?: GuestAccessPolicy;
  enabledAccessTiers?: AccessTierId[];
};

// ─── Extraction / Processing Types ───────────────────────────────────

export type ExtractionFieldStatus = 'detected' | 'uncertain' | 'missing';

export type ExtractionField = {
  label: string;
  value: string | null;
  status: ExtractionFieldStatus;
  confidence?: number;
};

export type ProcessingStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
};

// ─── AI Suggestion Types ─────────────────────────────────────────────

export type SuggestionType = 'description' | 'price' | 'capacity' | 'category' | 'visibility';

export type AISuggestion = {
  id: string;
  type: SuggestionType;
  title: string;
  subtitle?: string;
  currentValue?: string;
  suggestedValue: string;
  accepted: boolean;
};

// ─── Quick Edit Types ────────────────────────────────────────────────

export type QuickEditFieldType =
  | 'text'
  | 'date'
  | 'time'
  | 'number'
  | 'currency'
  | 'select'
  | 'multiline';

export type QuickEditField = {
  key: keyof EventDraft;
  label: string;
  type: QuickEditFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
};

// ─── Navigation Types ────────────────────────────────────────────────

export type HostStackParamList = {
  HostEventsScreen: undefined;
  CreateEventEntryScreen: undefined;
  FlyerUploadScreen: { draftId?: string };
  FlyerProcessingScreen: { draftId: string; flyerUri: string };
  FlyerScanErrorScreen: { draftId: string; fields: ExtractionField[] };
  AIEventEnhancementScreen: { draftId: string };
  EventPreviewQuickEditScreen: { draftId: string };
  PublishConfirmationScreen: { draftId: string };
  EventCreatedSuccessScreen: { eventId: string };
  HostEventControlScreen: { eventId: string };
  WebHandoffScreen: { draftId: string; reason?: string };
};

// ─── More Menu Types ─────────────────────────────────────────────────

export type MoreMenuAction =
  | 'edit'
  | 'duplicate'
  | 'pause_sales'
  | 'close_event'
  | 'view_guest_list'
  | 'launch_door_mode'
  | 'delete_draft'
  | 'view_analytics'
  | 'share';
