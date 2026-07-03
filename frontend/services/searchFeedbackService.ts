import { getJSON, setJSON } from './persistence';

export type SearchFeedbackAction = 'more_like_this' | 'not_interested' | 'hide_host' | 'less_like_this';

export interface SearchFeedbackSignal {
  id: string;
  eventId: string;
  hostName?: string | null;
  category?: string | null;
  action: SearchFeedbackAction;
  createdAt: string;
}

const FEEDBACK_KEY = 'echo.search.feedback.v1';

export async function getSearchFeedback(): Promise<SearchFeedbackSignal[]> {
  return getJSON<SearchFeedbackSignal[]>(FEEDBACK_KEY, []);
}

export async function addSearchFeedback(signal: Omit<SearchFeedbackSignal, 'id' | 'createdAt'>): Promise<SearchFeedbackSignal> {
  const feedback = await getSearchFeedback();
  const next: SearchFeedbackSignal = { ...signal, id: `fb_${Date.now()}`, createdAt: new Date().toISOString() };
  await setJSON(FEEDBACK_KEY, [next, ...feedback].slice(0, 250));
  return next;
}

export function getDismissedEventIds(feedback: SearchFeedbackSignal[]): string[] {
  return feedback.filter((item) => item.action === 'not_interested' || item.action === 'less_like_this').map((item) => item.eventId);
}

export function getHiddenHosts(feedback: SearchFeedbackSignal[]): string[] {
  return feedback.filter((item) => item.action === 'hide_host' && item.hostName).map((item) => String(item.hostName));
}
