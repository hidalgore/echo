/**
 * types/securityCenters.ts
 * ════════════════════════
 * Domain types for the Security & Trust subsystem: Attendee, Host, and Admin
 * surfaces. Pure TS — no React Native imports so these are unit-testable.
 */

// ─── Attendee ─────────────────────────────────────────────────────────────────

export type AttendeeSecurityState = {
  passkeyEnabled: boolean;
  mfaEnabled: boolean;
  ticketTransferProtection: boolean;
  newDeviceAlerts: boolean;
};

export type PrivacyControls = {
  /** Allow hosts to see anonymised attendance data for their events. */
  shareAttendanceWithHosts: boolean;
  /** Personalised recommendations via TuneMyECHO. */
  allowTuneMyEcho: boolean;
  /** Surface local events based on coarse location. */
  shareLocationForLocalEvents: boolean;
  /** Opt into marketing emails and push promotions. */
  marketingEmails: boolean;
};

export type RecommendationRow = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

// ─── Trusted device / login history ──────────────────────────────────────────

export type TrustedDevice = {
  id: string;
  name: string;
  /** e.g. "iPhone 15 Pro" */
  model: string;
  /** ISO date string of last seen. */
  lastSeen: string;
  /** Whether this device has been explicitly trusted. */
  trusted: boolean;
  /** Current device — cannot be removed. */
  current: boolean;
};

export type LoginHistoryEntry = {
  id: string;
  device: string;
  location: string;
  /** ISO date string. */
  at: string;
  /** Successful login or a blocked/suspicious attempt. */
  outcome: 'success' | 'blocked' | 'suspicious';
};

// ─── Host security ────────────────────────────────────────────────────────────

export type StaffMember = {
  id: string;
  name: string;
  role: 'scanner' | 'supervisor' | 'host_admin';
  /** Whether the staff member has active door-mode access. */
  active: boolean;
};

export type PayoutProtectionConfig = {
  enabled: boolean;
  /** Delay in hours before payouts release post-event. */
  holdHours: number;
  /** % of gross that is held back during the hold window. */
  holdPct: number;
};

export type EventRiskRow = {
  eventId: string;
  eventTitle: string;
  risk: 'low' | 'medium' | 'high';
  note: string;
};

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  /** ISO date string. */
  at: string;
  /** Machine-readable category. */
  category: 'access' | 'payout' | 'staff' | 'trust' | 'refund';
};

// ─── Admin queues ─────────────────────────────────────────────────────────────

export type AdminQueueItem = {
  id: string;
  kind: 'dispute' | 'trust_flag' | 'id_review' | 'refund_escalation';
  summary: string;
  /** ISO date string the item was created. */
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Optional ECHO username linked to this queue item. */
  linkedUser?: string;
};

export type AdminQueues = {
  disputes: AdminQueueItem[];
  trustFlags: AdminQueueItem[];
  idReviews: AdminQueueItem[];
  refundEscalations: AdminQueueItem[];
};
