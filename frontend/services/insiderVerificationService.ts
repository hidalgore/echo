import type { InsiderMission, InsiderFeedbackSubmission, InsiderRewardLedgerEntry } from '../types/insider';

const now = () => new Date().toISOString();

export type InsiderVerificationSignal =
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
  | 'backend_verified';

export interface InsiderMissionVerificationState {
  missionId: string;
  requiredSignals: InsiderVerificationSignal[];
  collectedSignals: InsiderVerificationSignal[];
  evidenceCount: number;
  submittedAt?: string;
  verifiedAt?: string;
  reviewReason?: string;
}

export function createVerificationState(mission: InsiderMission): InsiderMissionVerificationState {
  return {
    missionId: mission.id,
    requiredSignals: mission.requiredSignals ?? ['screen_visited', 'feature_event_completed', 'feedback_submitted'],
    collectedSignals: [],
    evidenceCount: 0,
  };
}

export function mergeSignals(
  state: InsiderMissionVerificationState,
  signals: InsiderVerificationSignal[],
): InsiderMissionVerificationState {
  return {
    ...state,
    collectedSignals: Array.from(new Set([...state.collectedSignals, ...signals])),
  };
}

export function signalsFromFeedback(feedback: InsiderFeedbackSubmission): InsiderVerificationSignal[] {
  const signals: InsiderVerificationSignal[] = ['feedback_submitted'];
  if (feedback.attachments.length > 0) signals.push('media_attached');
  return signals;
}

export function evaluateMissionVerification(
  mission: InsiderMission,
  state: InsiderMissionVerificationState,
): { verified: boolean; missingSignals: InsiderVerificationSignal[]; reason: string } {
  const required = mission.requiredSignals ?? state.requiredSignals;
  const missingSignals = required.filter((signal) => !state.collectedSignals.includes(signal));

  if (mission.requiresMedia && state.evidenceCount < 1) {
    if (!missingSignals.includes('media_attached')) missingSignals.push('media_attached');
  }

  if (missingSignals.length > 0) {
    return {
      verified: false,
      missingSignals,
      reason: `Waiting for verified activity: ${missingSignals.map((item) => item.replace(/_/g, ' ')).join(', ')}.`,
    };
  }

  return { verified: true, missingSignals: [], reason: 'Verified by background activity and submitted evidence.' };
}

export function buildVerifiedMissionReward(mission: InsiderMission): InsiderRewardLedgerEntry {
  return {
    id: `reward-mission-${Date.now()}`,
    kind: 'echo_credit',
    title: `${mission.title} verified`,
    credits: mission.rewardCredits,
    reputation: mission.rewardReputation,
    source: 'mission',
    createdAt: now(),
  };
}
