import type { InsiderApplication, InsiderApplicationStatus, InsiderWaitlistReasonCode } from '../types/insider';

const FOUNDING_LIMIT = 500;

export function getWaitlistMessage(status: InsiderApplicationStatus, reasonCodes: InsiderWaitlistReasonCode[]) {
  if (status === 'approved' || status === 'founding_insider') {
    return 'You are approved for ECHO Insider access. Your missions, rewards, and feedback tools are now unlocked.';
  }
  if (reasonCodes.includes('INVITE_ONLY_PRELAUNCH')) {
    return 'ECHO Insider is invite-only before public launch. Your profile is saved and will be activated when a matching testing need opens.';
  }
  if (reasonCodes.includes('OVERREPRESENTED_DEVICE') || reasonCodes.includes('OVERREPRESENTED_REGION') || reasonCodes.includes('OVERREPRESENTED_INTEREST')) {
    return 'Your profile is currently overrepresented in this cohort. You are saved in the waitlist and may be selected when ECHO needs your tester profile.';
  }
  if (reasonCodes.includes('INCOMPLETE_PROFILE')) {
    return 'Your application needs more profile detail before ECHO can confidently place you into the right testing cohort.';
  }
  return 'You are not selected for the current cohort, but your profile remains active for future ECHO testing opportunities.';
}

export function scoreInsiderApplication(input: Partial<InsiderApplication>, currentFoundingCount = 0): Pick<InsiderApplication, 'status' | 'profileCompleteness' | 'qualificationScore' | 'diversityScore' | 'engagementScore' | 'reasonCodes'> {
  const reasonCodes: InsiderWaitlistReasonCode[] = [];
  const tracks = input.tracks ?? [];
  const interests = input.interests ?? [];
  const testingInterests = input.testingInterests ?? [];
  const feedbackPreferences = input.feedbackPreferences ?? [];
  const rewardPreferences = input.rewardPreferences ?? [];
  const whyJoin = (input.whyJoin ?? '').trim();

  let completeness = 20;
  if (tracks.length) completeness += 12;
  if (interests.length >= 3) completeness += 12;
  if (testingInterests.length >= 2) completeness += 12;
  if (feedbackPreferences.length) completeness += 10;
  if (rewardPreferences.length) completeness += 8;
  if (input.city && input.state) completeness += 8;
  if (input.deviceType && input.deviceType !== 'unknown') completeness += 8;
  if (whyJoin.length > 80) completeness += 10;
  completeness = Math.min(100, completeness);

  let diversityScore = 45;
  if (tracks.includes('host')) diversityScore += 15;
  if (tracks.includes('venue')) diversityScore += 15;
  if (tracks.includes('security')) diversityScore += 12;
  if (tracks.includes('accessibility')) diversityScore += 18;
  if (input.deviceType === 'android') diversityScore += 8;
  if (input.hardwareTester) diversityScore += 8;
  diversityScore = Math.min(100, diversityScore);

  let engagementScore = 35;
  if (whyJoin.length > 80) engagementScore += 20;
  if (whyJoin.length > 180) engagementScore += 10;
  if (feedbackPreferences.includes('test_missions')) engagementScore += 12;
  if (feedbackPreferences.includes('interviews')) engagementScore += 8;
  if (testingInterests.length >= 4) engagementScore += 10;
  engagementScore = Math.min(100, engagementScore);

  const qualificationScore = Math.round(completeness * 0.25 + engagementScore * 0.2 + diversityScore * 0.25 + (tracks.length ? 75 : 35) * 0.2 + (input.hardwareTester ? 85 : 55) * 0.1);

  if (completeness < 45) reasonCodes.push('INCOMPLETE_PROFILE');
  if (qualificationScore < 45) reasonCodes.push('LOW_ENGAGEMENT');
  if (currentFoundingCount >= FOUNDING_LIMIT) reasonCodes.push('COHORT_FULL');

  let status: InsiderApplicationStatus = 'future_opportunity_pool';
  if (qualificationScore >= 90 && currentFoundingCount < FOUNDING_LIMIT) status = 'founding_insider';
  else if (qualificationScore >= 75) status = 'approved';
  else if (qualificationScore >= 60) status = 'priority_waitlist';
  else if (qualificationScore >= 45) status = 'cohort_waitlist';

  return { status, profileCompleteness: completeness, qualificationScore, diversityScore, engagementScore, reasonCodes };
}
