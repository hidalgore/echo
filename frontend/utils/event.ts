import { Event } from '../types';

export function isExpired(event: Event, now = new Date()): boolean {
  return new Date(event.end_time).getTime() < now.getTime();
}

export function isHappeningNow(event: Event, now = new Date()): boolean {
  const start = new Date(event.start_time).getTime();
  const end = new Date(event.end_time).getTime();
  const current = now.getTime();
  return current >= start && current <= end;
}

export function startsWithinHours(event: Event, hours: number, now = new Date()): boolean {
  const start = new Date(event.start_time).getTime();
  const current = now.getTime();
  const windowMs = hours * 60 * 60 * 1000;
  return start >= current && start <= current + windowMs;
}

export function getStartingPrice(event: Event): number {
  return Math.min(...event.ticket_types.map((ticket) => ticket.price));
}

export function sortByStartAsc(events: Event[]): Event[] {
  return [...events].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

export function sortByRelevance(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const nowA = isHappeningNow(a) ? 1 : 0;
    const nowB = isHappeningNow(b) ? 1 : 0;
    if (nowA !== nowB) return nowB - nowA;
    const featuredA = a.is_featured ? 1 : 0;
    const featuredB = b.is_featured ? 1 : 0;
    if (featuredA !== featuredB) return featuredB - featuredA;
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
}

export function getAgeLabel(age?: number | null): string | null {
  if (!age) return null;
  return `${age}+`;
}

// ─── Date Pill Filtering ─────────────────────────────────────

/** Today = happening now + starting later today (before midnight) */
export function isToday(event: Event, now = new Date()): boolean {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Currently happening (started before now, ends after now)
  if (start.getTime() <= now.getTime() && end.getTime() >= now.getTime()) return true;
  // Starts later today
  if (start.getTime() >= now.getTime() && start.getTime() <= todayEnd.getTime()) return true;
  return false;
}

/** Tomorrow = events starting tomorrow (midnight to midnight) */
export function isTomorrow(event: Event, now = new Date()): boolean {
  const start = new Date(event.start_time);
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
  return start.getTime() >= tomorrowStart.getTime() && start.getTime() <= tomorrowEnd.getTime();
}

/**
 * This Weekend = Thursday 5:00 PM → Sunday 11:59 PM (user local time)
 * If already past Sunday, looks ahead to next Thursday.
 */
export function isThisWeekend(event: Event, now = new Date()): boolean {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat

  // Calculate Thursday 5PM of this week
  let thursOffset = 4 - dayOfWeek; // days until Thursday
  if (dayOfWeek === 0) {
    // It's Sunday — if past 11:59PM we'd roll to next week, but Sunday IS part of weekend
    // Check if we're still in the current weekend window
    thursOffset = -3; // last Thursday
  } else if (thursOffset < 0) {
    // Already past Thursday this week — that's fine, we're IN the weekend window
  }

  const thursday5pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + thursOffset, 17, 0, 0);
  
  // Calculate Sunday 11:59 PM
  let sunOffset = 0 - dayOfWeek; // days until Sunday (0)
  if (sunOffset <= 0 && dayOfWeek !== 0) sunOffset += 7;
  if (dayOfWeek === 0) sunOffset = 0; // today is Sunday
  const sunday1159pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + sunOffset, 23, 59, 59);

  // If we're past Sunday midnight, target NEXT weekend
  if (now.getTime() > sunday1159pm.getTime()) {
    const nextThurs = new Date(sunday1159pm.getTime());
    nextThurs.setDate(nextThurs.getDate() + 4);
    nextThurs.setHours(17, 0, 0, 0);
    const nextSun = new Date(nextThurs.getTime());
    nextSun.setDate(nextSun.getDate() + 3);
    nextSun.setHours(23, 59, 59, 0);
    return start.getTime() >= nextThurs.getTime() && start.getTime() <= nextSun.getTime();
  }

  // Event starts within the weekend window
  if (start.getTime() >= thursday5pm.getTime() && start.getTime() <= sunday1159pm.getTime()) return true;
  // Event is currently happening during the weekend window
  if (start.getTime() <= now.getTime() && end.getTime() >= thursday5pm.getTime()) return true;
  return false;
}

/** Custom date: events starting on a specific date */
export function isOnDate(event: Event, date: Date): boolean {
  const start = new Date(event.start_time);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return start.getTime() >= dayStart.getTime() && start.getTime() <= dayEnd.getTime();
}

/** Date range: events starting within a range */
export function isInDateRange(event: Event, startDate: Date, endDate: Date): boolean {
  const start = new Date(event.start_time);
  const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
  const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
  return start.getTime() >= rangeStart.getTime() && start.getTime() <= rangeEnd.getTime();
}

/** Master filter — applies the selected date pill */
export function filterByDatePill(events: Event[], selectedDate: string): Event[] {
  if (!selectedDate || selectedDate === 'all') return events;
  const now = new Date();

  if (selectedDate === 'today') return events.filter(e => isToday(e, now));
  if (selectedDate === 'tomorrow') return events.filter(e => isTomorrow(e, now));
  if (selectedDate === 'weekend') return events.filter(e => isThisWeekend(e, now));

  if (selectedDate.startsWith('custom:')) {
    const date = new Date(selectedDate.replace('custom:', ''));
    return events.filter(e => isOnDate(e, date));
  }

  if (selectedDate.startsWith('range:')) {
    const [, startStr, endStr] = selectedDate.split(':');
    return events.filter(e => isInDateRange(e, new Date(startStr), new Date(endStr)));
  }

  return events;
}

/** Filter events by city name (matches against venue_address) */
export function filterByCity(events: Event[], city?: string): Event[] {
  if (!city) return events;
  const q = city.toLowerCase();
  return events.filter(e =>
    (e.venue_address || '').toLowerCase().includes(q) ||
    (e.venue_name || '').toLowerCase().includes(q)
  );
}
