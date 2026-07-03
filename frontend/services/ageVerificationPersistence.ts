import { getJSON, setJSON, removeKey } from './persistence';

export type VerifiedAgeBand = 'none' | '18+' | '21+';

export interface AgeVerificationRecord {
  userId: string;
  verifiedAgeBand: VerifiedAgeBand;
  verifiedAt: string;
  expiresAt: string;
  verificationProvider: 'mock' | 'stripe_identity' | 'persona' | 'manual_review';
  verificationReferenceId: string;
  allowedAgeGates: Array<'18+' | '21+'>;
}

const AGE_VERIFICATION_KEY = 'echo.identity.ageVerification.v1';
const DEFAULT_EXPIRY_DAYS = 365;

export async function getAgeVerificationRecord(): Promise<AgeVerificationRecord | null> {
  const record = await getJSON<AgeVerificationRecord | null>(AGE_VERIFICATION_KEY, null);
  if (!record) return null;
  if (new Date(record.expiresAt).getTime() <= Date.now()) return null;
  return record;
}

export async function saveMockAgeVerification(ageBand: Exclude<VerifiedAgeBand, 'none'> = '21+'): Promise<AgeVerificationRecord> {
  const now = Date.now();
  const allowedAgeGates: Array<'18+' | '21+'> = ageBand === '21+' ? ['18+', '21+'] : ['18+'];
  const record: AgeVerificationRecord = {
    userId: 'user_current',
    verifiedAgeBand: ageBand,
    verifiedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    verificationProvider: 'mock',
    verificationReferenceId: `mock_age_${now}`,
    allowedAgeGates,
  };
  await setJSON(AGE_VERIFICATION_KEY, record);
  return record;
}

export async function clearAgeVerificationRecord(): Promise<void> {
  await removeKey(AGE_VERIFICATION_KEY);
}

export async function canAccessAgeGate(requiredAge?: number | null): Promise<boolean> {
  if (!requiredAge) return true;
  const record = await getAgeVerificationRecord();
  if (!record) return false;
  if (requiredAge >= 21) return record.allowedAgeGates.includes('21+');
  if (requiredAge >= 18) return record.allowedAgeGates.includes('18+');
  return true;
}
