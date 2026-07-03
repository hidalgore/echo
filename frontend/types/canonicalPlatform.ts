/**
 * ECHO Canonical Platform Types — Phase 2 Lock Expansion
 * ════════════════════════════════════════════════════════
 * Merges the locked Claude Master Build Prompt, Trust & Access Control,
 * Access Control System v1, Event Creation V3, Website V2, and ECHO chat
 * history into reusable engineering contracts.
 *
 * Rule: do not redesign locked ECHO features. Extend existing systems only.
 */

import type {
  AccessTierId,
  AccessZoneId,
  EventSchedule,
  TeamRole,
  V3EventState,
} from './v3';

// ─── Canonical Positioning ──────────────────────────────────────────────────

export const ECHO_CANONICAL_POSITIONING = {
  platformCategory: 'Trusted Access Platform',
  productDefinition: 'ECHO is not a ticketing platform. ECHO is a Trusted Access Platform where ticketing is one capability.',
  moat: 'ECHO Trust Network™',
  pillars: ['Identity', 'Trust', 'Access', 'Community', 'Discovery', 'Security', 'Hardware', 'Host Success'] as const,
  uxPrinciples: ['Apple-quality', 'premium', 'trustworthy', 'minimal', 'fast', 'invisible trust', 'no enterprise clutter'] as const,
};

export type EchoTrustLayer = 'identity' | 'host' | 'venue' | 'event' | 'payment' | 'access' | 'hardware';
export const ECHO_TRUST_HIERARCHY: EchoTrustLayer[] = ['identity', 'host', 'venue', 'event', 'payment', 'access', 'hardware'];

// ─── EchoTrustEngine ────────────────────────────────────────────────────────

export type TrustSignalSeverity = 'info' | 'positive' | 'warning' | 'critical';
export type TrustDecision = 'allow' | 'allow_with_review' | 'hold' | 'deny' | 'escalate';

export type TrustSignal = {
  id: string;
  layer: EchoTrustLayer;
  label: string;
  severity: TrustSignalSeverity;
  weight: number;
  observedAt: string;
  source: 'system' | 'host' | 'door_mode' | 'payment' | 'identity_provider' | 'hardware' | 'support';
  metadata?: Record<string, string | number | boolean | null>;
};

export type EchoTrustProfile = {
  subjectId: string;
  subjectType: 'user' | 'host' | 'venue' | 'event' | 'device' | 'credential';
  internalScore?: number;
  publicLabel?: 'Verified' | 'Trusted' | 'Review Required' | 'Restricted';
  signals: TrustSignal[];
  lastEvaluatedAt: string;
  decision: TrustDecision;
  recommendationOnly: boolean;
};

export type UserTrustFactors = {
  emailVerified: boolean;
  phoneVerified: boolean;
  ageVerificationStatus: 'not_required' | 'required' | 'pending' | '18_verified' | '21_verified' | 'failed';
  trustedDeviceCount: number;
  accountAgeDays: number;
  purchaseCount: number;
  attendanceCount: number;
  refundCount: number;
  chargebackCount: number;
  securityIncidentCount: number;
};

export type HostTrustFactors = {
  businessVerified: boolean;
  taxVerified: boolean;
  venueVerificationRate: number;
  refundRatePct: number;
  chargebackRatePct: number;
  completedEventCount: number;
  attendanceSuccessPct: number;
  reputationSignals: TrustSignal[];
};

// ─── Remaining EchoTrustEngine layer factor inputs (decision 4A) ─────────────

export type VenueTrustFactors = {
  ownershipVerified: boolean;
  capacityVerified: boolean;
  venueManagerCount: number;
  priorEventCount: number;
  incidentCount: number;
};

export type EventTrustFactors = {
  hostVerified: boolean;
  ageGatingConfigured: boolean;
  refundPolicySet: boolean;
  /** 0-100 Flyer Score from the V3 health center */
  flyerScore: number;
  duplicateReportCount: number;
};

export type PaymentTrustFactors = {
  processorConnected: boolean;
  mfaEnabled: boolean;
  chargebackRatePct: number;
  refundRatePct: number;
  payoutHoldActive: boolean;
};

export type AccessTrustFactors = {
  signedCredentials: boolean;
  replayProtection: boolean;
  duplicateScanDetection: boolean;
  offlineCacheValid: boolean;
  /** True when NFC uses challenge-response (not serial-number-only) */
  nfcChallengeResponse: boolean;
};

export type HardwareTrustFactors = {
  /** Disc Pro device certificate present in the Trusted Hardware Registry */
  deviceCertified: boolean;
  cloneDetection: boolean;
  secureElement: boolean;
  trustedRegistryEnrolled: boolean;
  firmwareCurrent: boolean;
};

// ─── Verified Venue Program ─────────────────────────────────────────────────

export type VerifiedVenueStatus = 'unverified' | 'pending_review' | 'verified' | 'restricted' | 'revoked';

export type VerifiedVenueProfile = {
  venueId: string;
  name: string;
  ownershipVerified: boolean;
  capacityVerified: boolean;
  venueManagerUserIds: string[];
  trustScore?: number;
  status: VerifiedVenueStatus;
  verifiedAt?: string;
  restrictions?: string[];
};

// ─── Licensing, Agency, Team Access ─────────────────────────────────────────

export type VerifiedHostEntity = {
  hostEntityId: string;
  legalName: string;
  displayName: string;
  subscriptionId: string;
  licenseTierId: 'launch' | 'pro' | 'elite';
  verified: boolean;
  oneSubscriptionOneEntityEnforced: true;
  agencyWorkspaceId?: string;
};

export type AgencyWorkspace = {
  workspaceId: string;
  ownerHostEntityId: string;
  brandHostEntityIds: string[];
  payoutAccountIds: string[];
  staffUserIds: string[];
  reportingScope: 'per_brand' | 'workspace_rollup' | 'both';
};

export type EchoPermissionId =
  | 'event.create'
  | 'event.publish'
  | 'event.pause'
  | 'event.resume'
  | 'event.cancel'
  | 'event.schedule_publish'
  | 'event.edit_pricing'
  | 'event.view_reports'
  | 'finance.view_payouts'
  | 'finance.edit_bank'
  | 'marketing.manage_campaigns'
  | 'door.scan'
  | 'door.override'
  | 'door.deny_guest'
  | 'door.security_hold'
  | 'door.emergency_lockdown'
  | 'team.manage_roles'
  | 'trust.review_queue';

export const ECHO_ROLE_PERMISSION_MATRIX: Record<TeamRole, EchoPermissionId[]> = {
  owner: [
    'event.create', 'event.publish', 'event.pause', 'event.resume', 'event.cancel', 'event.schedule_publish',
    'event.edit_pricing', 'event.view_reports', 'finance.view_payouts', 'finance.edit_bank', 'marketing.manage_campaigns',
    'door.scan', 'door.override', 'door.deny_guest', 'door.security_hold', 'door.emergency_lockdown', 'team.manage_roles', 'trust.review_queue',
  ],
  admin: [
    'event.create', 'event.publish', 'event.pause', 'event.resume', 'event.cancel', 'event.schedule_publish',
    'event.edit_pricing', 'event.view_reports', 'finance.view_payouts', 'marketing.manage_campaigns',
    'door.scan', 'door.override', 'door.deny_guest', 'door.security_hold', 'door.emergency_lockdown', 'trust.review_queue',
  ],
  finance: ['event.view_reports', 'finance.view_payouts', 'finance.edit_bank'],
  event_manager: [
    'event.create', 'event.publish', 'event.pause', 'event.resume', 'event.schedule_publish', 'event.edit_pricing',
    'event.view_reports', 'marketing.manage_campaigns', 'door.scan', 'door.override', 'door.deny_guest', 'door.security_hold', 'trust.review_queue',
  ],
  marketing: ['marketing.manage_campaigns', 'event.view_reports'],
  door_staff: ['door.scan'],
  volunteer: ['door.scan'],
  // decision 1A — Security role: door scanning, denials, holds, override, and trust review.
  security: ['door.scan', 'door.deny_guest', 'door.security_hold', 'door.override', 'trust.review_queue'],
};

export type TemporaryEventAccessPass = {
  temporaryAccessId: string;
  eventId: string;
  userId: string;
  role: Extract<TeamRole, 'door_staff' | 'volunteer'>;
  permissions: EchoPermissionId[];
  startsAt: string;
  expiresAt: string;
  autoExpires: true;
  revokedAt?: string;
};

// ─── Authentication, Trusted Devices, Payout Security ───────────────────────

export type EchoAuthMethod = 'password' | 'passkey' | 'face_id' | 'touch_id' | 'windows_hello' | 'magic_link' | 'sms_otp';

export type TrustedDevice = {
  deviceId: string;
  userId: string;
  deviceName: string;
  platform: 'ios' | 'android' | 'web' | 'windows' | 'macos' | 'unknown';
  trusted: boolean;
  reputation: 'trusted' | 'new' | 'watch' | 'blocked';
  firstSeenAt: string;
  lastSeenAt: string;
  revokedAt?: string;
};

export type PayoutSecurityChange = {
  changeId: string;
  hostEntityId: string;
  changeType: 'bank_account' | 'stripe_account' | 'tax_profile' | 'payout_schedule';
  requestedByUserId: string;
  mfaRequired: true;
  emailConfirmationRequired: true;
  securityReviewRequired: true;
  holdHours: 72;
  status: 'pending_confirmation' | 'under_review' | 'hold_active' | 'approved' | 'rejected';
  requestedAt: string;
  releaseAt?: string;
};

// ─── Access Pass / Credential Security ──────────────────────────────────────

export type AccessPassStatus = 'issued' | 'wallet_ready' | 'active' | 'used' | 'suspended' | 'revoked' | 'refunded' | 'expired';
export type CredentialType = 'apple_wallet' | 'google_wallet' | 'echo_app' | 'nfc_credential' | 'qr_fallback';

export type AccessPass = {
  id: string;
  attendeeId: string;
  eventId: string;
  tierId: AccessTierId; // backstage + custom_host_tier are now canonical AccessTierId members (decision 2A)
  permissions: AccessZoneId[];
  walletCredentialId?: string;
  nfcCredentialId?: string;
  qrCredentialId?: string;
  status: AccessPassStatus;
  issuedAt: string;
  validatedAt?: string;
};

export type SignedCredential = {
  credentialId: string;
  accessPassId: string;
  type: CredentialType;
  eventId: string;
  tierId: AccessTierId; // backstage + custom_host_tier are now canonical AccessTierId members (decision 2A)
  accessRights: AccessZoneId[];
  validationToken: string;
  signature: string;
  issuedAt: string;
  expiresAt?: string;
  rotatingQrEnabled?: boolean;
  screenshotResistant?: boolean;
};

export type NFCChallengeResponseConfig = {
  credentialId: string;
  hardwareDeviceId?: string;
  challengeNonce: string;
  signedResponseRequired: true;
  serialNumberOnlyValidationAllowed: false;
  replayProtectionEnabled: true;
};

// ─── Door Mode / Emergency Operations ───────────────────────────────────────

export type DoorModeCheckpoint = 'main_entry' | 'vip_lounge' | 'meet_and_greet' | 'backstage' | 'after_party' | 'sponsor_lounge' | 'restricted_area' | 'green_room' | 'stage_access' | 'operations_areas';
export type DoorModeStatus = 'online' | 'offline_ready' | 'syncing' | 'locked_down' | 'disabled';

export type DoorModeSession = {
  sessionId: string;
  eventId: string;
  checkpoint: DoorModeCheckpoint;
  scannerDeviceId: string;
  startedByUserId: string;
  status: DoorModeStatus;
  faceIdResumeEnabled: boolean;
  offlineEncryptionEnabled: true;
  lostDeviceModeEnabled?: boolean;
  remoteDisableEnabled: true;
  scanLatencyTargetMs: 500;
  startedAt: string;
  endedAt?: string;
};

export type EmergencyLockdown = {
  lockdownId: string;
  eventId: string;
  initiatedByUserId: string;
  reason: string;
  admissionsPaused: true;
  incidentManagementActive: true;
  startedAt: string;
  resolvedAt?: string;
};

export type DoorModeAnalytics = {
  eventId: string;
  attendanceByTier: Record<string, number>;
  checkInPct: number;
  arrivalCurveBuckets: Array<{ label: string; count: number }>;
  loungeUtilization: Record<string, number>;
  entrySuccessRatePct: number;
  restrictedAreaUsage: Record<string, number>;
  vipAttendanceMetrics: { expected: number; arrived: number; noShow: number };
};

// ─── Audit System ───────────────────────────────────────────────────────────

export type EchoAuditTargetType = 'user' | 'host' | 'venue' | 'event' | 'access_pass' | 'credential' | 'device' | 'payout' | 'role' | 'door_session';
export type EchoAuditResult = 'success' | 'blocked' | 'failed' | 'escalated' | 'reversed';

export type EchoAuditRecord = {
  auditId: string;
  actorUserId: string;
  actorRole?: TeamRole;
  action: string;
  timestamp: string;
  location?: { latitude?: number; longitude?: number; label?: string };
  deviceId?: string;
  targetType: EchoAuditTargetType;
  targetId: string;
  result: EchoAuditResult;
  immutableRetention: true;
  metadata?: Record<string, string | number | boolean | null>;
};

// ─── Event Creation V3 Canonical Build Contract ─────────────────────────────

export type EventCreationV3CanonicalWorkflow = {
  primaryPath: 'upload_flyer';
  secondaryPath: 'start_from_scratch';
  steps: ['Upload Flyer', 'AI Scan', 'Review Extracted Information', 'Event Health Check', 'Market Pulse', 'Publish & Sales Schedule', 'Launch Center'];
  scheduleModel: EventSchedule;
  allowedStates: V3EventState[];
};

export const EVENT_CREATION_V3_CANONICAL_WORKFLOW: EventCreationV3CanonicalWorkflow = {
  primaryPath: 'upload_flyer',
  secondaryPath: 'start_from_scratch',
  steps: ['Upload Flyer', 'AI Scan', 'Review Extracted Information', 'Event Health Check', 'Market Pulse', 'Publish & Sales Schedule', 'Launch Center'],
  scheduleModel: { eventDate: '', publishDate: '', salesStartDate: '' },
  allowedStates: ['draft', 'scheduled', 'published', 'paused', 'ended'],
};

// ─── Website V2 Canonical Route Contract ────────────────────────────────────

export type WebsiteV2RouteId = '/' | '/explore' | '/hosts' | '/pricing' | '/trust' | '/circle' | '/hardware' | '/nonprofits' | '/login' | '/event/[id]';

export type WebsiteV2Route = {
  route: WebsiteV2RouteId;
  purpose: string;
  requirement: string;
};

export const WEBSITE_V2_ROUTES: WebsiteV2Route[] = [
  { route: '/', purpose: 'Premium homepage and conversion hub', requirement: 'Complete V2 section order with host-first conversion.' },
  { route: '/explore', purpose: 'Public event discovery', requirement: 'Reuse existing public event data and mock event cards.' },
  { route: '/hosts', purpose: 'Host landing page', requirement: 'Expand host tools, create event, Door Mode, reports, pricing.' },
  { route: '/pricing', purpose: 'Subscription tiers', requirement: 'Use locked Launch / Pro / Elite licensing; avoid Starter/Growth drift.' },
  { route: '/trust', purpose: 'Trust & Access Center', requirement: 'Age verification, NFC, guest controls, offline Door Mode.' },
  { route: '/circle', purpose: 'ECHO Circle explainer', requirement: 'Group purchase flow with claim window and universal link story.' },
  { route: '/hardware', purpose: 'ECHO Disc hardware', requirement: 'Disc Core, Disc Pro concept, Door Mode pairing.' },
  { route: '/nonprofits', purpose: 'Nonprofit tools', requirement: 'Donation campaign, reporting, receipts, verified nonprofit badge.' },
  { route: '/login', purpose: 'Portal entry', requirement: 'Separate host and attendee login paths.' },
  { route: '/event/[id]', purpose: 'Public event details', requirement: 'Purchase-ready and age-verification compatible.' },
];

// ─── Questions / Drift Control ──────────────────────────────────────────────

export type OpenBuildQuestion = {
  id: string;
  topic: string;
  recommendation: string;
  options: string[];
  defaultLock: string;
};

export const ECHO_PHASE2_OPEN_BUILD_QUESTIONS: OpenBuildQuestion[] = [
  {
    id: 'Q1_PRICING_LABEL_CONFLICT',
    topic: 'Website PDF says Starter/Growth/Elite, while locked licensing says Launch/Pro/Elite.',
    recommendation: 'Keep Launch / Pro / Elite because licensing was already locked. Use Starter/Growth only as internal audience descriptors if needed.',
    options: ['Keep Launch / Pro / Elite', 'Switch website labels to Starter / Growth / Elite', 'Show public labels as Launch / Growth / Elite'],
    defaultLock: 'Keep Launch / Pro / Elite',
  },
  {
    id: 'Q2_HERO_COPY_CONFLICT',
    topic: 'Earlier file used “operating system for live event access”; Website V2 locks “The new front door for live events.”',
    recommendation: 'Use Website V2 copy on the public homepage and keep “operating system for live event access” as supporting or investor copy.',
    options: ['Use new front door as public hero', 'Use operating system as public hero', 'A/B test both'],
    defaultLock: 'Use new front door as public hero',
  },
  {
    id: 'Q3_ACCESS_PASS_LANGUAGE',
    topic: 'Users understand “tickets,” but engineering specifies “Access Passes.”',
    recommendation: 'Use Access Pass in wallet/access/security surfaces; allow ticket language only in pricing and quantity purchase moments.',
    options: ['Access Pass everywhere', 'Ticket everywhere', 'Hybrid by context'],
    defaultLock: 'Hybrid by context',
  },
  {
    id: 'Q4_DISC_CORE_SCOPE',
    topic: 'Disc Core is passive NFC but Access Control spec references hardware consistency across readers and future wearables.',
    recommendation: 'Keep Disc Core passive. Put challenge-response, clone detection, LED/camera, and secure element features under Disc Pro/future registry.',
    options: ['Core passive only', 'Core adds electronics', 'Core passive + Pro secured hardware'],
    defaultLock: 'Core passive + Pro secured hardware',
  },
];
