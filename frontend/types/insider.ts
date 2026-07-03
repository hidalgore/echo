/**
 * ECHO Insider Program — Canonical Product Types v1
 * Locked decisions:
 * - Invite-only before public launch, visible to all users at launch.
 * - Founding Insider cohort capped at 500 initially.
 * - No fixed points-to-dollar conversion at launch.
 * - Hosts can award bonus credits to testers at events.
 * - Credits can be earned from real event attendance and testing.
 * - Future partner rewards supported.
 */

export type InsiderTrack = 'attendee' | 'host' | 'venue' | 'security' | 'promoter' | 'artist' | 'sponsor' | 'accessibility';

export type InsiderApplicationStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'founding_insider'
  | 'approved'
  | 'priority_waitlist'
  | 'cohort_waitlist'
  | 'future_opportunity_pool'
  | 'inactive_application';

export type InsiderTier = 'explorer' | 'contributor' | 'advisor' | 'champion' | 'founding_insider';

export type InsiderRewardKind =
  | 'echo_credit'
  | 'reputation'
  | 'ticket_credit'
  | 'host_bonus'
  | 'attendance_bonus'
  | 'partner_reward'
  | 'merch'
  | 'access_upgrade'
  | 'roadmap_access';

export type InsiderFeedbackCategory =
  | 'bug'
  | 'design_issue'
  | 'confusing_experience'
  | 'missing_feature'
  | 'performance_issue'
  | 'security_concern'
  | 'accessibility_issue'
  | 'positive_feedback'
  | 'enhancement_idea';

export type InsiderFeedbackSeverity = 'cosmetic' | 'minor' | 'major' | 'critical';

export type InsiderMissionStatus = 'available' | 'in_progress' | 'submitted' | 'pending_verification' | 'verified' | 'needs_evidence' | 'expired';

export type InsiderWaitlistReasonCode =
  | 'INVITE_ONLY_PRELAUNCH'
  | 'OVERREPRESENTED_DEVICE'
  | 'OVERREPRESENTED_REGION'
  | 'OVERREPRESENTED_INTEREST'
  | 'COHORT_FULL'
  | 'LOW_ENGAGEMENT'
  | 'INCOMPLETE_PROFILE'
  | 'FUTURE_COHORT_MATCH'
  | 'HOST_PRIORITY_ACTIVE'
  | 'ACCESSIBILITY_PRIORITY_ACTIVE';

export interface InsiderApplication {
  id: string;
  userId: string;
  status: InsiderApplicationStatus;
  tracks: InsiderTrack[];
  interests: string[];
  city?: string;
  state?: string;
  deviceType?: 'ios' | 'android' | 'web' | 'unknown';
  eventFrequency?: '0_1' | '2_4' | '5_10' | '10_plus';
  testingInterests: string[];
  feedbackPreferences: string[];
  rewardPreferences: string[];
  hardwareTester: boolean;
  whyJoin?: string;
  profileCompleteness: number;
  qualificationScore: number;
  diversityScore: number;
  engagementScore: number;
  reasonCodes: InsiderWaitlistReasonCode[];
  submittedAt?: string;
}

export interface InsiderProfile {
  userId: string;
  visibleAtLaunch: boolean;
  inviteOnlyPrelaunch: boolean;
  foundingCohortLimit: number;
  applicationStatus: InsiderApplicationStatus;
  tier: InsiderTier;
  reputation: number;
  echoCredits: number;
  creditsHaveFixedDollarValue: false;
  monthlyRedemptionCapCents?: number;
  completedMissions: number;
  feedbackSubmitted: number;
  verifiedBugs: number;
  eventsAttendedWithRewards: number;
  hostBonusCreditsReceived: number;
  partnerRewardsEnabled: boolean;
  badges: string[];
}

export interface InsiderMission {
  id: string;
  title: string;
  description: string;
  featureArea: string;
  status: InsiderMissionStatus;
  rewardReputation: number;
  rewardCredits: number;
  requiresMedia?: boolean;
  requiredSignals?: Array<
    | 'screen_visited'
    | 'feature_event_completed'
    | 'wallet_pass_created'
    | 'circle_invite_created'
    | 'door_scan_simulated'
    | 'nfc_scan_detected'
    | 'eligible_event_attended'
    | 'experience_recap_completed'
    | 'media_attached'
    | 'feedback_submitted'
    | 'host_confirmed'
    | 'backend_verified'
  >;
  verificationSummary?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

export interface InsiderFeedbackAttachment {
  id: string;
  uri: string;
  type: 'photo' | 'video' | 'screen_recording' | 'voice_note' | 'document';
  fileName?: string;
}

export interface InsiderFeedbackSubmission {
  id: string;
  missionId?: string;
  category: InsiderFeedbackCategory;
  severity: InsiderFeedbackSeverity;
  title: string;
  whatWereYouTryingToDo: string;
  whatHappened: string;
  whatExpected: string;
  reproducibility: 'always' | 'sometimes' | 'once' | 'not_sure';
  attachments: InsiderFeedbackAttachment[];
  deviceContext: {
    appVersion: string;
    platform: string;
    screenName?: string;
    timestamp: string;
  };
  aiTriage?: {
    suggestedCategory: InsiderFeedbackCategory;
    suggestedSeverity: InsiderFeedbackSeverity;
    summary: string;
    confidence: number;
  };
}

export interface InsiderRewardLedgerEntry {
  id: string;
  kind: InsiderRewardKind;
  title: string;
  credits: number;
  reputation: number;
  source: 'mission' | 'feedback' | 'attendance' | 'host_bonus' | 'partner' | 'manual';
  eventId?: string;
  hostId?: string;
  createdAt: string;
  expiresAt?: string;
}
