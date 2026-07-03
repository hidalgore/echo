import { create } from 'zustand';
import type { InsiderApplication, InsiderFeedbackSubmission, InsiderMission, InsiderProfile, InsiderRewardLedgerEntry } from '../types/insider';
import { scoreInsiderApplication } from '../services/insiderQualificationService';
import {
  buildVerifiedMissionReward,
  createVerificationState,
  evaluateMissionVerification,
  mergeSignals,
  signalsFromFeedback,
  type InsiderMissionVerificationState,
  type InsiderVerificationSignal,
} from '../services/insiderVerificationService';

const now = () => new Date().toISOString();

const defaultProfile: InsiderProfile = {
  userId: 'mock-user',
  visibleAtLaunch: true,
  inviteOnlyPrelaunch: true,
  foundingCohortLimit: 500,
  applicationStatus: 'not_started',
  tier: 'explorer',
  reputation: 0,
  echoCredits: 0,
  creditsHaveFixedDollarValue: false,
  monthlyRedemptionCapCents: 0,
  completedMissions: 0,
  feedbackSubmitted: 0,
  verifiedBugs: 0,
  eventsAttendedWithRewards: 0,
  hostBonusCreditsReceived: 0,
  partnerRewardsEnabled: true,
  badges: [],
};

const defaultApplication: InsiderApplication = {
  id: 'insider-app-001',
  userId: 'mock-user',
  status: 'draft',
  tracks: ['attendee'],
  interests: ['Music', 'Nightlife', 'Nonprofit'],
  city: 'Tacoma',
  state: 'WA',
  deviceType: 'ios',
  eventFrequency: '2_4',
  testingInterests: ['event_discovery', 'wallet_passes', 'nfc_access', 'echo_circle'],
  feedbackPreferences: ['surveys', 'test_missions', 'screenshots'],
  rewardPreferences: ['echo_credits', 'exclusive_access', 'event_tickets'],
  hardwareTester: false,
  whyJoin: '',
  profileCompleteness: 0,
  qualificationScore: 0,
  diversityScore: 0,
  engagementScore: 0,
  reasonCodes: [],
};

const defaultMissions: InsiderMission[] = [
  {
    id: 'mission-wallet-001',
    title: 'Wallet Pass Polish Test',
    description: 'Add an ECHO ticket to wallet, inspect pass details, and report any friction.',
    featureArea: 'Wallet Passes',
    status: 'available',
    rewardReputation: 100,
    rewardCredits: 25,
    requiresMedia: true,
    requiredSignals: ['screen_visited', 'wallet_pass_created', 'feedback_submitted', 'media_attached'],
  },
  {
    id: 'mission-circle-001',
    title: 'ECHO Circle Claim Flow',
    description: 'Create a group purchase and test the claim experience from invite to wallet.',
    featureArea: 'ECHO Circle',
    status: 'available',
    rewardReputation: 150,
    rewardCredits: 50,
    requiresMedia: true,
    requiredSignals: ['screen_visited', 'circle_invite_created', 'feedback_submitted', 'media_attached'],
  },
  {
    id: 'mission-door-001',
    title: 'NFC Door Mode Simulation',
    description: 'Validate scan states, denial reasons, and accessibility labels during check-in.',
    featureArea: 'Door Mode',
    status: 'available',
    rewardReputation: 200,
    rewardCredits: 75,
    requiresMedia: true,
    requiredSignals: ['screen_visited', 'door_scan_simulated', 'feedback_submitted', 'media_attached'],
  },
];

const defaultVerification = Object.fromEntries(defaultMissions.map((mission) => [mission.id, createVerificationState(mission)]));

interface InsiderState {
  profile: InsiderProfile;
  application: InsiderApplication;
  missions: InsiderMission[];
  missionVerification: Record<string, InsiderMissionVerificationState>;
  feedback: InsiderFeedbackSubmission[];
  ledger: InsiderRewardLedgerEntry[];
  updateApplication: (patch: Partial<InsiderApplication>) => void;
  submitApplication: () => void;
  submitFeedback: (feedback: Omit<InsiderFeedbackSubmission, 'id' | 'deviceContext'>) => void;
  startMission: (missionId: string) => void;
  recordMissionSignal: (missionId: string, signal: InsiderVerificationSignal) => void;
  submitMissionForVerification: (missionId: string) => void;
  awardAttendanceCredits: (eventId: string, credits: number, reputation?: number) => void;
  awardHostBonusCredits: (eventId: string, hostId: string, credits: number, title?: string) => void;
}

export const useInsiderStore = create<InsiderState>((set, get) => ({
  profile: defaultProfile,
  application: defaultApplication,
  missions: defaultMissions,
  missionVerification: defaultVerification,
  feedback: [],
  ledger: [],
  updateApplication: (patch) => set((state) => ({ application: { ...state.application, ...patch, status: state.application.status === 'not_started' ? 'draft' : state.application.status } })),
  submitApplication: () => set((state) => {
    const score = scoreInsiderApplication(state.application, 128);
    const submitted = { ...state.application, ...score, submittedAt: now() };
    return {
      application: submitted,
      profile: {
        ...state.profile,
        applicationStatus: submitted.status,
        tier: submitted.status === 'founding_insider' ? 'founding_insider' : state.profile.tier,
        badges: submitted.status === 'founding_insider' ? Array.from(new Set([...state.profile.badges, 'Founding Insider'])) : state.profile.badges,
      },
    };
  }),
  startMission: (missionId) => set((state) => ({
    missions: state.missions.map((item) => item.id === missionId && item.status === 'available' ? { ...item, status: 'in_progress', verificationSummary: 'Started. ECHO is waiting for real activity signals before rewards can unlock.' } : item),
    missionVerification: {
      ...state.missionVerification,
      [missionId]: state.missionVerification[missionId] ?? createVerificationState(state.missions.find((item) => item.id === missionId)!),
    },
  })),
  recordMissionSignal: (missionId, signal) => set((state) => {
    const mission = state.missions.find((item) => item.id === missionId);
    if (!mission) return state;
    const current = state.missionVerification[missionId] ?? createVerificationState(mission);
    return {
      missionVerification: { ...state.missionVerification, [missionId]: mergeSignals(current, [signal]) },
    };
  }),
  submitFeedback: (payload) => set((state) => {
    const submission: InsiderFeedbackSubmission = {
      ...payload,
      id: `feedback-${Date.now()}`,
      deviceContext: { appVersion: 'v59.6', platform: 'expo', timestamp: now() },
      aiTriage: {
        suggestedCategory: payload.category,
        suggestedSeverity: payload.severity,
        summary: `${payload.title} — ${payload.whatHappened}`.slice(0, 160),
        confidence: 0.86,
      },
    };
    const feedbackReward: InsiderRewardLedgerEntry = {
      id: `reward-feedback-${Date.now()}`,
      kind: 'reputation',
      title: payload.attachments.length ? 'Feedback submitted with evidence' : 'Feedback submitted for review',
      credits: 0,
      reputation: payload.attachments.length ? 75 : 50,
      source: 'feedback',
      createdAt: now(),
    };

    const missionId = payload.missionId;
    let missionVerification = state.missionVerification;
    let missions = state.missions;
    if (missionId) {
      const mission = state.missions.find((item) => item.id === missionId);
      if (mission) {
        const current = state.missionVerification[missionId] ?? createVerificationState(mission);
        const merged = mergeSignals(current, signalsFromFeedback(submission));
        missionVerification = {
          ...state.missionVerification,
          [missionId]: { ...merged, evidenceCount: merged.evidenceCount + payload.attachments.length },
        };
        missions = state.missions.map((item) => item.id === missionId ? { ...item, status: item.status === 'available' ? 'in_progress' : item.status, verificationSummary: 'Feedback received. Submit mission for background verification when all activity is complete.' } : item);
      }
    }

    return {
      missions,
      missionVerification,
      feedback: [submission, ...state.feedback],
      ledger: [feedbackReward, ...state.ledger],
      profile: { ...state.profile, feedbackSubmitted: state.profile.feedbackSubmitted + 1, reputation: state.profile.reputation + feedbackReward.reputation },
    };
  }),
  submitMissionForVerification: (missionId) => set((state) => {
    const mission = state.missions.find((item) => item.id === missionId);
    if (!mission || mission.status === 'verified') return state;
    const current = state.missionVerification[missionId] ?? createVerificationState(mission);
    const submittedState = { ...current, submittedAt: now() };
    const result = evaluateMissionVerification(mission, submittedState);

    if (!result.verified) {
      return {
        missionVerification: { ...state.missionVerification, [missionId]: { ...submittedState, reviewReason: result.reason } },
        missions: state.missions.map((item) => item.id === missionId ? { ...item, status: 'needs_evidence', verificationSummary: result.reason } : item),
      };
    }

    const reward = buildVerifiedMissionReward(mission);
    return {
      missionVerification: { ...state.missionVerification, [missionId]: { ...submittedState, verifiedAt: now(), reviewReason: result.reason } },
      missions: state.missions.map((item) => item.id === missionId ? { ...item, status: 'verified', verifiedAt: now(), verificationSummary: result.reason } : item),
      ledger: [reward, ...state.ledger],
      profile: { ...state.profile, completedMissions: state.profile.completedMissions + 1, reputation: state.profile.reputation + reward.reputation, echoCredits: state.profile.echoCredits + reward.credits },
    };
  }),
  awardAttendanceCredits: (eventId, credits, reputation = credits) => set((state) => {
    const reward: InsiderRewardLedgerEntry = { id: `reward-attendance-${Date.now()}`, kind: 'attendance_bonus', title: 'Verified event attendance reward', credits, reputation, source: 'attendance', eventId, createdAt: now() };
    return { ledger: [reward, ...state.ledger], profile: { ...state.profile, eventsAttendedWithRewards: state.profile.eventsAttendedWithRewards + 1, echoCredits: state.profile.echoCredits + credits, reputation: state.profile.reputation + reputation } };
  }),
  awardHostBonusCredits: (eventId, hostId, credits, title = 'Host bonus reward') => set((state) => {
    const reward: InsiderRewardLedgerEntry = { id: `reward-host-${Date.now()}`, kind: 'host_bonus', title, credits, reputation: credits, source: 'host_bonus', eventId, hostId, createdAt: now() };
    return { ledger: [reward, ...state.ledger], profile: { ...state.profile, hostBonusCreditsReceived: state.profile.hostBonusCreditsReceived + credits, echoCredits: state.profile.echoCredits + credits, reputation: state.profile.reputation + credits } };
  }),
}));
