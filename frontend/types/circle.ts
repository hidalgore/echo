/**
 * ECHO Circle — Type Definitions (Elite Spec v1)
 * ════════════════════════════════════════════════
 * Canonical states: Created → Waiting → Action Needed → Complete | Closed
 * Member slots: Open → Invited → Pending → Claimed | Replaced | Released | Expired
 */

// ─── Circle States (Spec §6) ────────────────────────────────────────────
export type CircleStatus =
  | 'created'        // Organizer paid; no claims yet
  | 'waiting'        // At least one invite pending/open
  | 'action_needed'  // Timer near end or expired with open spots
  | 'complete'       // All seats paid and assigned
  | 'closed';        // Open spots released or no longer editable

// ─── Member Slot States (Spec §6) ───────────────────────────────────────
export type MemberSlotStatus =
  | 'open'       // Slot available — invite or assign
  | 'invited'    // Invite sent, awaiting response
  | 'pending'    // Guest opened invite, payment in progress
  | 'claimed'    // Guest paid and owns slot (terminal)
  | 'replaced'   // Original guest replaced (slot reused)
  | 'released'   // Spot returned to inventory
  | 'expired';   // Claim window ended without action

// ─── Member Slot ─────────────────────────────────────────────────────────
export type CircleMember = {
  id: string;
  slotIndex: number;
  name: string | null;
  avatarUrl: string | null;
  initials: string;
  accentColor: string;
  status: MemberSlotStatus;
  isOrganizer: boolean;
  amount: number;
  inviteMethod?: 'sms' | 'echo_search' | 'share_link' | 'email';
  invitedAt?: string;
  claimedAt?: string;
  hasBeenReplaced: boolean;
  replacedBy?: string;
};

// ─── Circle Model ────────────────────────────────────────────────────────
export type EchoCircle = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventImageUrl?: string;
  eventStartISO: string;    // For proximity calculations
  status: CircleStatus;
  totalTickets: number;
  pricePerTicket: number;
  createdAt: string;
  expiresAt: string;
  secondsRemaining: number;
  members: CircleMember[];
  organizerId: string;
  replacementsUsed: number;
  maxReplacements: 3;
  inviteLink: string;
};

// ─── Derived Counts ──────────────────────────────────────────────────────
export type CircleDerivedCounts = {
  total: number;
  claimed: number;
  /** Members with status 'invited' only (subset of pending). */
  invited: number;
  /** Members awaiting resolution: status 'invited' or 'pending'. */
  pending: number;
  open: number;
  released: number;
  expired: number;
  replaced: number;
};

// ─── Editability ─────────────────────────────────────────────────────────
export type EditabilityState =
  | 'editable'         // Timer active AND > 60 min before event
  | 'timer_expired'    // Claim window ended — force Cover or Release
  | 'event_locked'     // Within 60 min of event start
  | 'resolved';        // Circle is complete or closed

export type TimerState = 'running' | 'warning' | 'expired' | 'not_applicable';

// ─── Actions ─────────────────────────────────────────────────────────────
export type CircleAction =
  | 'createCircle' | 'inviteMember' | 'remindMember' | 'replaceMember'
  | 'removePendingSlot' | 'claimSpot' | 'coverRemaining' | 'releaseRemaining'
  | 'expireTimer' | 'markComplete' | 'closeCircle';

// ─── Pricing (Spec §12) ─────────────────────────────────────────────────
export type CirclePricing = {
  subtotal: number;
  fees: number;
  tax: number;
  dueNow: number;
  remainingCircleValue: number;
  payAllTotal: number;
  currency: 'USD';
};

// ─── Edge States (Spec §11) ─────────────────────────────────────────────
export type CircleEdgeCase =
  | 'invalid_invite' | 'already_claimed' | 'guest_payment_failure'
  | 'organizer_edit_locked' | 'duplicate_claim' | 'protected_reserved';

export type CircleEdgeInfo = {
  type: CircleEdgeCase;
  headline: string;
  body: string;
  cta?: { label: string; action: string };
};

// ─── Wallet Priority (Spec §7) ──────────────────────────────────────────
export type WalletPriority =
  | 'active_ticket_hero' | 'circle_hero' | 'circle_complete'
  | 'circle_closed' | 'default';

// ─── Circle Hub Display (Spec §6 matrix) ────────────────────────────────
export type CircleHubDisplay = {
  status: CircleStatus;
  headline: string;
  subheadline: string;
  primaryCta: { label: string; action: string } | null;
  secondaryCtas: { label: string; action: string }[];
  visualPosture: 'pulse' | 'waiting' | 'urgent' | 'stable' | 'receded';
};
