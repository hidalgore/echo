/**
 * ECHO Verification Store (Zustand)
 * 6 states: unverified | skipped | pending_review | verifying | verified | failed
 * 3 retry attempts before locked → Contact Support
 * Canonical: "Verified once. Trusted everywhere."
 */
import { create } from 'zustand';

export type VerificationStatus = 'unverified' | 'skipped' | 'pending_review' | 'verifying' | 'verified' | 'failed';
export type VerifiedAgeBand = '18_plus' | '21_plus' | null;
export type VerificationMethod = 'government_id' | 'digital_wallet' | null;
export type NonprofitStatus = 'unverified' | 'provisional' | 'verified';

const MAX_ATTEMPTS = 3;

interface VerificationState {
  status: VerificationStatus;
  verifiedAgeBand: VerifiedAgeBand;
  verifiedAt: string | null;
  method: VerificationMethod;
  attemptCount: number;
  isLocked: boolean;
  nonprofitStatus: NonprofitStatus;
  nonprofitName: string | null;

  isAgeEligible: (minimumAge: 0 | 18 | 21) => boolean;
  requiresVerification: (minimumAge: 0 | 18 | 21) => boolean;
  canRetry: () => boolean;

  skipVerification: () => void;
  startVerification: (method: VerificationMethod) => void;
  setPendingReview: () => void;
  setVerifying: () => void;
  setVerified: (band: VerifiedAgeBand) => void;
  setFailed: () => void;
  resetToUnverified: () => void;
  clearAgeVerification: () => void;
  setNonprofitStatus: (status: NonprofitStatus, name?: string | null) => void;
}

export const useVerificationStore = create<VerificationState>((set, get) => ({
  status: 'unverified',
  verifiedAgeBand: null,
  verifiedAt: null,
  method: null,
  attemptCount: 0,
  isLocked: false,
  nonprofitStatus: 'unverified',
  nonprofitName: null,

  isAgeEligible: (min) => {
    const b = get().verifiedAgeBand;
    if (min === 0) return true;
    if (min === 18) return b === '18_plus' || b === '21_plus';
    if (min === 21) return b === '21_plus';
    return false;
  },
  requiresVerification: (min) => min > 0 && !get().isAgeEligible(min),
  canRetry: () => !get().isLocked && get().attemptCount < MAX_ATTEMPTS,

  skipVerification: () => set({ status: 'skipped' }),
  startVerification: (method) => set({ status: 'verifying', method }),
  setPendingReview: () => set({ status: 'pending_review' }),
  setVerifying: () => set({ status: 'verifying' }),
  setVerified: (band) => set({ status: 'verified', verifiedAgeBand: band, verifiedAt: new Date().toISOString() }),
  setFailed: () => {
    const next = get().attemptCount + 1;
    set({ status: 'failed', attemptCount: next, isLocked: next >= MAX_ATTEMPTS });
  },
  resetToUnverified: () => set({ status: 'unverified', method: null }),
  clearAgeVerification: () => set({ status: 'unverified', verifiedAgeBand: null, verifiedAt: null, method: null, attemptCount: 0, isLocked: false }),
  setNonprofitStatus: (s, name = null) => set({ nonprofitStatus: s, nonprofitName: name }),
}));
