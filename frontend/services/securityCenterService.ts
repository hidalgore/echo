/**
 * services/securityCenterService.ts
 * ══════════════════════════════════
 * Mock factories for Security Center surfaces (Attendee, Host, Admin).
 * Replace each mock with a real Supabase call in Phase 3; the function
 * signatures and return types are canonical — components depend on them.
 *
 * Pure TS — no RN import.
 */

import type {
  TrustedDevice,
  LoginHistoryEntry,
  StaffMember,
  PayoutProtectionConfig,
  AuditLogEntry,
  AdminQueueItem,
  AdminQueues,
  PrivacyControls,
  RecommendationRow,
} from '../types/securityCenters';

// ─── Attendee mocks ───────────────────────────────────────────────────────────

export function defaultPrivacyControls(): PrivacyControls {
  return {
    shareAttendanceWithHosts: true,
    allowTuneMyEcho: true,
    shareLocationForLocalEvents: false,
    marketingEmails: false,
  };
}

export function tuneMyEchoDefaults(): RecommendationRow[] {
  return [
    {
      id: 'rec_genre',
      label: 'Genre preferences',
      description: 'Surface events in genres you attend most.',
      enabled: true,
    },
    {
      id: 'rec_proximity',
      label: 'Nearby events',
      description: 'Show events within your preferred radius.',
      enabled: true,
    },
    {
      id: 'rec_circle',
      label: 'Circle activity',
      description: 'Highlight events your Circle members are attending.',
      enabled: true,
    },
    {
      id: 'rec_price',
      label: 'Price sensitivity',
      description: 'Personalise based on your typical spend range.',
      enabled: false,
    },
  ];
}

export function mockTrustedDevices(): TrustedDevice[] {
  return [
    {
      id: 'dev_01',
      name: 'My iPhone',
      model: 'iPhone 15 Pro',
      lastSeen: new Date().toISOString(),
      trusted: true,
      current: true,
    },
    {
      id: 'dev_02',
      name: 'iPad',
      model: 'iPad Pro 12.9"',
      lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      trusted: true,
      current: false,
    },
    {
      id: 'dev_03',
      name: 'Unknown device',
      model: 'Android Device',
      lastSeen: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      trusted: false,
      current: false,
    },
  ];
}

export function mockLoginHistory(): LoginHistoryEntry[] {
  return [
    {
      id: 'lh_01',
      device: 'iPhone 15 Pro',
      location: 'Seattle, WA',
      at: new Date().toISOString(),
      outcome: 'success',
    },
    {
      id: 'lh_02',
      device: 'iPad Pro',
      location: 'Tacoma, WA',
      at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      outcome: 'success',
    },
    {
      id: 'lh_03',
      device: 'Unknown',
      location: 'Lagos, NG',
      at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      outcome: 'blocked',
    },
  ];
}

// ─── Host mocks ───────────────────────────────────────────────────────────────

export function mockStaff(): StaffMember[] {
  return [
    { id: 'stf_01', name: 'Jordan M.', role: 'host_admin', active: true },
    { id: 'stf_02', name: 'Aaliyah R.', role: 'supervisor', active: true },
    { id: 'stf_03', name: 'Devon K.', role: 'scanner', active: true },
    { id: 'stf_04', name: 'Sam T.', role: 'scanner', active: false },
  ];
}

export function defaultPayoutProtection(enabled: boolean): PayoutProtectionConfig {
  return { enabled, holdHours: 48, holdPct: 10 };
}

export function mockHostAuditLog(): AuditLogEntry[] {
  return [
    {
      id: 'al_01',
      actor: 'Jordan M.',
      action: 'Added scanner: Devon K.',
      at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      category: 'staff',
    },
    {
      id: 'al_02',
      actor: 'System',
      action: 'Checkout hold placed: order #CH-8821',
      at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      category: 'trust',
    },
    {
      id: 'al_03',
      actor: 'Aaliyah R.',
      action: 'Supervisor override: guest admitted after ID check',
      at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      category: 'access',
    },
    {
      id: 'al_04',
      actor: 'ECHO Trust',
      action: 'Payout protection: hold extended 24 hrs (high risk)',
      at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      category: 'payout',
    },
  ];
}

// ─── Admin mocks ──────────────────────────────────────────────────────────────

export function mockAdminQueues(): AdminQueues {
  return {
    disputes: [
      {
        id: 'dsp_01',
        kind: 'dispute',
        summary: 'Attendee disputes charge for event #EVT-4412',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        linkedUser: '@maya.r',
      },
      {
        id: 'dsp_02',
        kind: 'dispute',
        summary: 'Double charge reported: order #ORD-9901',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        linkedUser: '@dev42',
      },
    ],
    trustFlags: [
      {
        id: 'tf_01',
        kind: 'trust_flag',
        summary: 'Scalping pattern detected: 14 transfers in 2 hrs',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        priority: 'critical',
        linkedUser: '@u_1182',
      },
      {
        id: 'tf_02',
        kind: 'trust_flag',
        summary: 'Multi-account device flagged at checkout',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        priority: 'high',
      },
    ],
    idReviews: [
      {
        id: 'idr_01',
        kind: 'id_review',
        summary: 'Age verification document awaiting manual review',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        linkedUser: '@new_user_88',
      },
    ],
    refundEscalations: [
      {
        id: 're_01',
        kind: 'refund_escalation',
        summary: 'Host denied refund — attendee escalated to ECHO',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        linkedUser: '@kira.v',
      },
    ],
  };
}
