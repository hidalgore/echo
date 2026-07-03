import { Platform } from 'react-native';
import type { EventDraft } from '../types/hostEvents';

export type FlyerScanResult = {
  draft: EventDraft;
  rawText: string;
  confidence: number;
  method: 'ocr' | 'heuristic';
};

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function titleCase(input: string) {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\bDj\b/g, 'DJ');
}

function inferCategory(text: string): EventDraft['category'] {
  const lower = text.toLowerCase();
  if (/(concert|live music|dj|band|jazz|hip hop|r&b|afrobeats|latin night|festival)/.test(lower)) return 'Music';
  if (/(party|club|nightlife|afterparty|rooftop)/.test(lower)) return 'Nightlife';
  if (/(brunch|wine|food|drink|tasting)/.test(lower)) return 'Food & Drink';
  if (/(comedy|standup)/.test(lower)) return 'Comedy';
  if (/(art|gallery|museum|culture|exhibit)/.test(lower)) return 'Art';
  if (/(network|mixer|summit|conference|founder)/.test(lower)) return 'Tech';
  if (/(wellness|yoga|fitness|healing)/.test(lower)) return 'Other';
  return 'Other';
}

function guessTitle(lines: string[]) {
  const blocked = /(tickets|doors|ages|21\+|18\+|all ages|rsvp|www\.|http|follow|instagram|friday|saturday|sunday|monday|tuesday|wednesday|thursday|january|february|march|april|may|june|july|august|september|october|november|december)/i;
  const candidates = lines
    .map((line) => line.replace(/[^\w&+'’:\- ]/g, '').trim())
    .filter(Boolean)
    .filter((line) => line.length >= 4 && line.length <= 48)
    .filter((line) => !blocked.test(line))
    .sort((a, b) => b.length - a.length);

  if (!candidates.length) return 'Untitled Event';

  const raw = candidates[0];
  const upperRatio = raw.replace(/[^A-Z]/g, '').length / Math.max(raw.replace(/[^A-Za-z]/g, '').length, 1);
  return upperRatio > 0.55 ? titleCase(raw) : raw;
}

function parseDate(text: string) {
  const lower = text.toLowerCase();
  const monthMap: Record<string, number> = {
    january: 1,
    jan: 1,
    february: 2,
    feb: 2,
    march: 3,
    mar: 3,
    april: 4,
    apr: 4,
    may: 5,
    june: 6,
    jun: 6,
    july: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sep: 9,
    sept: 9,
    october: 10,
    oct: 10,
    november: 11,
    nov: 11,
    december: 12,
    dec: 12,
  };

  let m = lower.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/i);
  if (m) {
    const month = monthMap[m[1].replace('.', '')];
    const day = Number(m[2]);
    const year = Number(m[3] || new Date().getFullYear());
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  m = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (m) {
    let year = Number(m[3] || new Date().getFullYear());
    if (year < 100) year += 2000;
    return `${year}-${String(Number(m[1])).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`;
  }

  return '';
}

function to12Hour(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 || 12;
  return `${normalized}:${String(minute).padStart(2, '0')} ${period}`;
}

function parseTimes(text: string) {
  const matches = [...text.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s?(AM|PM)\b/gi)].map((m) => {
    const hour = Number(m[1]);
    const minute = Number(m[2] || 0);
    const period = m[3].toUpperCase();
    let normalized = hour % 12;
    if (period === 'PM') normalized += 12;
    return { raw: m[0], hour24: normalized, minute };
  });

  if (!matches.length) return { startTime: '', endTime: '', doorsOpenTime: '' };

  const start = matches[0];
  const end = matches[1];
  return {
    startTime: to12Hour(start.hour24, start.minute),
    endTime: end ? to12Hour(end.hour24, end.minute) : '',
    doorsOpenTime: start ? to12Hour(Math.max(start.hour24 - 1, 0), start.minute) : '',
  };
}

function parseVenue(lines: string[]) {
  for (const line of lines) {
    const trimmed = line.trim();
    const atMatch = trimmed.match(/(?:^|\s)(?:at|@)\s+(.{3,})$/i);
    if (atMatch) return atMatch[1].trim();
  }

  const blocked = /(ticket|doors|price|\$|ages|follow|instagram|www\.|http|rsvp|text|call|eventbrite)/i;
  const venueLine = lines.find((line) => {
    const trimmed = line.trim();
    return (
      !blocked.test(trimmed) &&
      /(hall|club|lounge|arena|rooftop|center|centre|bar|winery|vineyards|theater|theatre|park|plaza|hotel|museum|gallery|studio)/i.test(trimmed)
    );
  });

  return venueLine?.trim() || '';
}

function parsePrice(text: string) {
  const all = [...text.matchAll(/\$(\d{1,3})(?:\.\d{2})?/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n > 0);
  return all.length ? Math.min(...all) : 0;
}

function parseAge(text: string): EventDraft['ageRequirement'] {
  if (/21\+/.test(text)) return '21+';
  if (/18\+/.test(text)) return '18+';
  return 'All Ages';
}

function parseCapacity(text: string) {
  const match = text.match(/\b(?:capacity|limited to|limited)\s*(?:seating)?\s*(\d{2,4})\b/i);
  if (match) return Number(match[1]);
  return 150;
}

function buildDescription(text: string, title: string, venue: string) {
  const compact = normalizeWhitespace(text);
  if (compact.length <= 220) return compact;
  if (title && venue) return `${title} at ${venue}. Details extracted from flyer and ready for host review before publishing.`;
  return 'Event details extracted from flyer and ready for host review before publishing.';
}

export function parseFlyerText(rawText: string, flyerUri?: string): FlyerScanResult {
  const text = normalizeWhitespace(rawText || '');
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const title = guessTitle(lines);
  const venue = parseVenue(lines);
  const date = parseDate(text);
  const { startTime, endTime, doorsOpenTime } = parseTimes(text);
  const price = parsePrice(text);
  const ageRequirement = parseAge(text);
  const capacity = parseCapacity(text);
  const category = inferCategory(text);
  const visibility: EventDraft['visibility'] = 'public';
  const extractedCount = [title && title !== 'Untitled Event', venue, date, startTime, price > 0].filter(Boolean).length;
  const confidence = Math.max(0.35, Math.min(0.96, 0.35 + extractedCount * 0.12 + (ageRequirement !== 'All Ages' ? 0.05 : 0)));

  return {
    method: text ? 'ocr' : 'heuristic',
    rawText: text,
    confidence,
    draft: {
      id: `draft_${Date.now()}`,
      flyerImage: flyerUri,
      title,
      venue,
      date,
      startTime,
      endTime,
      doorsOpenTime,
      price,
      capacity,
      ageRequirement,
      visibility,
      category,
      description: buildDescription(text, title, venue),
      extractionConfidence: confidence,
      extractionIssues: [
        !venue ? 'venue_missing' : null,
        !date ? 'date_missing' : null,
        !startTime ? 'time_missing' : null,
      ].filter(Boolean) as string[],
      suggestedDescription: buildDescription(text, title, venue),
      suggestedPriceRange: price > 0 ? { min: Math.max(price - 10, 0), max: price + 15 } : undefined,
      suggestedCapacityRange: { min: Math.max(capacity - 30, 25), max: capacity + 30 },
    },
  };
}

const ENABLE_WEB_OCR = false;

async function runWebOCR(flyerUri: string) {
  if (!ENABLE_WEB_OCR) {
    return '';
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '';
  }

  try {
    // tesseract.js is a browser/Node library and cannot run in React Native.
    // OCR on mobile should use expo-camera or a native OCR SDK.
    console.warn('Web OCR is not available in React Native');
    return '';
  } catch (error) {
    console.warn('web ocr failed', error);
    return '';
  }
}

export async function scanFlyerFromUri(flyerUri: string): Promise<FlyerScanResult> {
  let rawText = '';
  try {
    if (Platform.OS === 'web') {
      rawText = await runWebOCR(flyerUri);
    }
  } catch (error) {
    console.warn('flyer scan fallback', error);
    rawText = '';
  }
  return parseFlyerText(rawText, flyerUri);
}
