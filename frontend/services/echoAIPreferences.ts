import { getJSON, setJSON } from './persistence';

export interface EchoAIPreferences {
  personalizedPicks: boolean;
  useViewingActivity: boolean;
  useLocationForNearby: boolean;
  eventInterestsResetAt?: string | null;
}

const PREF_KEY = 'echo.ai.preferences.v1';

export const DEFAULT_ECHO_AI_PREFERENCES: EchoAIPreferences = {
  personalizedPicks: true,
  useViewingActivity: true,
  useLocationForNearby: true,
  eventInterestsResetAt: null,
};

export async function getEchoAIPreferences(): Promise<EchoAIPreferences> {
  const stored = await getJSON<Partial<EchoAIPreferences>>(PREF_KEY, {});
  return { ...DEFAULT_ECHO_AI_PREFERENCES, ...stored };
}

export async function saveEchoAIPreferences(next: EchoAIPreferences): Promise<void> {
  await setJSON(PREF_KEY, next);
}

export async function resetEchoEventInterests(): Promise<EchoAIPreferences> {
  const next = { ...(await getEchoAIPreferences()), eventInterestsResetAt: new Date().toISOString() };
  await saveEchoAIPreferences(next);
  return next;
}
