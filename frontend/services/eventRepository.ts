import type { Event } from '../types';
import { MOCK_EVENTS } from './mock';
import { getJSON, setJSON } from './persistence';

const HOSTED_EVENTS_KEY = 'echo.hostedEvents.v1';

export async function loadHostedEvents(): Promise<Event[]> {
  return getJSON<Event[]>(HOSTED_EVENTS_KEY, []);
}

export async function saveHostedEvents(events: Event[]): Promise<void> {
  await setJSON(HOSTED_EVENTS_KEY, events);
}

export async function getMergedPublishedEvents(): Promise<Event[]> {
  const hosted = await loadHostedEvents();
  return [...hosted, ...MOCK_EVENTS.filter((seed) => !hosted.some((h) => h.id === seed.id))];
}
