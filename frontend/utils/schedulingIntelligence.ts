/**
 * Scheduling Intelligence Engine
 * ═══════════════════════════════
 * Computes Market Pulse, Smart Reschedule Calendar, and alternative suggestions.
 * Deterministic app-side logic using nearby event data.
 */
import type {
  NearbyEvent, MarketPulseResult, CalendarDay, SchedulingSuggestion,
  SchedulingIntelligenceResult, SaturationLevel, DayColor,
} from '../types/dashboard';

// ═══════════════════════════════════════════════════════════════════
// MOCK NEARBY EVENTS (25-mile radius simulation)
// ═══════════════════════════════════════════════════════════════════

const VENUE_POOL = [
  'The Showbox', 'Neumos', 'Crocodile', 'Moore Theatre', 'Neptune Theatre',
  'The Paramount', 'El Corazon', 'Barboza', 'Nectar Lounge', 'Chop Suey',
  'The Gorge', 'Warehouse District', 'Pier 91', 'The Foundry', 'Summit',
];

function generateNearbyEvents(category: string, city: string, date: string): NearbyEvent[] {
  const seed = (category + city + date).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i: number) => ((seed * (i + 7) * 13) % 997) / 997;
  const count = Math.floor(rng(0) * 8) + 2; // 2-9 events

  const categories = ['Music', 'Nightlife', 'Food & Drink', 'Arts & Culture', 'Sports', 'Comedy', 'Networking', 'Community'];
  const events: NearbyEvent[] = [];

  for (let i = 0; i < count; i++) {
    const r = rng(i + 1);
    const catIdx = Math.floor(rng(i + 10) * categories.length);
    const eventCat = r < 0.4 ? category : categories[catIdx]; // 40% same category
    const isSameCat = eventCat === category;
    const hourOffset = Math.floor(rng(i + 20) * 8) - 2; // -2 to +5 hours from selected
    const similarity: NearbyEvent['similarityType'] =
      isSameCat && Math.abs(hourOffset) <= 2 ? 'direct'
        : isSameCat ? 'adjacent'
        : 'unrelated';

    events.push({
      id: `nearby_${i}`,
      title: `${eventCat} Night at ${VENUE_POOL[i % VENUE_POOL.length]}`,
      category: eventCat,
      venue: VENUE_POOL[i % VENUE_POOL.length],
      distanceMiles: Math.round((rng(i + 30) * 20 + 1) * 10) / 10,
      startTime: `${date}T${String(19 + hourOffset).padStart(2, '0')}:00:00`,
      endTime: `${date}T${String(22 + hourOffset).padStart(2, '0')}:00:00`,
      similarityType: similarity,
      audienceOverlapLikelihood: similarity === 'direct' ? 0.6 + rng(i + 40) * 0.3
        : similarity === 'adjacent' ? 0.2 + rng(i + 50) * 0.3
        : rng(i + 60) * 0.15,
      prominenceWeight: 0.3 + rng(i + 70) * 0.7,
    });
  }

  return events;
}

// ═══════════════════════════════════════════════════════════════════
// MARKET PULSE COMPUTATION
// ═══════════════════════════════════════════════════════════════════

export function computeMarketPulse(
  category: string,
  city: string,
  date: string,
  time: string,
): MarketPulseResult {
  const events = generateNearbyEvents(category, city, date);
  const directOverlaps = events.filter((e) => e.similarityType === 'direct');
  const adjacentOverlaps = events.filter((e) => e.similarityType === 'adjacent');

  // Weighted saturation score
  let satScore = 0;
  events.forEach((e) => {
    if (e.similarityType === 'direct') satScore += 20 * e.prominenceWeight;
    else if (e.similarityType === 'adjacent') satScore += 8 * e.prominenceWeight;
    else satScore += 2 * e.prominenceWeight;
  });
  satScore = Math.min(Math.round(satScore), 100);

  const satLevel: SaturationLevel =
    satScore <= 15 ? 'low'
      : satScore <= 35 ? 'moderate'
      : satScore <= 55 ? 'high'
      : satScore <= 75 ? 'crowded'
      : 'saturated';

  // Time-slot pressure
  const timeSlotPressure = directOverlaps.length === 0 ? 'Low'
    : directOverlaps.length <= 2 ? 'Moderate' : 'High';

  // Uniqueness = inverse of same-category density
  const sameCatCount = events.filter((e) => e.category === category).length;
  const uniqueness = Math.max(0, Math.round(100 - sameCatCount * 15));

  // Opportunity = inverse of saturation
  const opportunity = Math.max(0, 100 - satScore);

  // Insight text
  const insightParts: string[] = [];
  if (directOverlaps.length > 0) {
    insightParts.push(`${directOverlaps.length} similar ${category} event${directOverlaps.length > 1 ? 's' : ''} in the same time window within 25 miles`);
  }
  if (sameCatCount > 3) {
    insightParts.push(`${sameCatCount} total ${category} events that day in ${city}`);
  }
  if (insightParts.length === 0) {
    insightParts.push(`Low competition for ${category} events in ${city} on this date`);
  }

  // Recommendation
  let recommendation: string;
  if (satLevel === 'low') {
    recommendation = 'Great timing. This slot has minimal competition — your event can own the audience.';
  } else if (satLevel === 'moderate') {
    recommendation = 'Manageable competition. Your event can succeed here with strong promotion.';
  } else if (satLevel === 'high') {
    recommendation = 'Consider reviewing nearby alternatives. A small shift in date or time could reduce audience splitting.';
  } else {
    recommendation = 'This slot is highly competitive. We found less crowded alternatives that may improve your turnout.';
  }

  return {
    saturationLevel: satLevel,
    saturationScore: satScore,
    nearbyEventCount: events.length,
    directOverlapCount: directOverlaps.length,
    adjacentOverlapCount: adjacentOverlaps.length,
    timeSlotPressure,
    localUniqueness: uniqueness,
    opportunityScore: opportunity,
    insightText: insightParts.join('. ') + '.',
    recommendation,
    nearbyEvents: events,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SMART RESCHEDULE CALENDAR
// ═══════════════════════════════════════════════════════════════════

export function generateCalendarDays(
  category: string,
  city: string,
  centerDate: string,
): CalendarDay[] {
  const center = new Date(centerDate + 'T12:00:00');
  const days: CalendarDay[] = [];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let offset = -3; offset <= 25; offset++) {
    const d = new Date(center);
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    const dow = DOW[d.getDay()];

    // Generate pulse for this day
    const pulse = computeMarketPulse(category, city, dateStr, '20:00');

    let color: DayColor;
    if (pulse.saturationScore <= 15) color = 'dark_green';
    else if (pulse.saturationScore <= 35) color = 'green';
    else if (pulse.saturationScore <= 60) color = 'amber';
    else color = 'red';

    const peakWindow = pulse.directOverlapCount > 0
      ? '7 PM - 11 PM' : 'No peak crowding';

    const bestWindows: string[] = [];
    if (d.getDay() === 0 || d.getDay() === 6) { // weekend
      if (pulse.saturationScore < 40) bestWindows.push('2 PM - 5 PM');
      bestWindows.push('6 PM - 9 PM');
    } else {
      bestWindows.push('7 PM - 10 PM');
      if (pulse.saturationScore < 30) bestWindows.push('5 PM - 7 PM');
    }

    const rationale = pulse.directOverlapCount === 0
      ? `No direct ${category} competition. ${pulse.nearbyEventCount} other events in the area.`
      : `${pulse.directOverlapCount} competing ${category} event${pulse.directOverlapCount > 1 ? 's' : ''} nearby. Saturation: ${pulse.saturationLevel}.`;

    days.push({
      date: dateStr,
      dayOfWeek: dow,
      color,
      similarEventCount: pulse.nearbyEventCount,
      directOverlapCount: pulse.directOverlapCount,
      peakCrowdingWindow: peakWindow,
      bestTimeWindows: bestWindows,
      rationale,
    });
  }

  return days;
}

// ═══════════════════════════════════════════════════════════════════
// SUGGESTION GENERATOR
// ═══════════════════════════════════════════════════════════════════

export function generateSuggestions(
  calendar: CalendarDay[],
  currentDate: string,
): SchedulingSuggestion[] {
  const currentDay = calendar.find((d) => d.date === currentDate);
  const currentScore = currentDay ? currentDay.similarEventCount : 0;

  return calendar
    .filter((d) => d.date !== currentDate && (d.color === 'green' || d.color === 'dark_green'))
    .sort((a, b) => a.directOverlapCount - b.directOverlapCount)
    .slice(0, 3)
    .map((d) => {
      const reduction = currentScore > 0 && d.similarEventCount < currentScore
        ? Math.round(((currentScore - d.similarEventCount) / currentScore) * 100) : 0;
      return {
        date: d.date,
        time: d.bestTimeWindows[0] || '7 PM',
        dayOfWeek: d.dayOfWeek,
        reason: d.rationale,
        competitionReduction: `${reduction}% less competition`,
        opportunityScore: d.color === 'dark_green' ? 90 : 75,
      };
    });
}

// ═══════════════════════════════════════════════════════════════════
// FULL SCHEDULING INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

export function computeSchedulingIntelligence(
  category: string,
  city: string,
  date: string,
  time: string,
): SchedulingIntelligenceResult {
  const pulse = computeMarketPulse(category, city, date, time);
  const calendar = generateCalendarDays(category, city, date);
  const suggestions = generateSuggestions(calendar, date);
  const showCalendar = pulse.saturationLevel === 'high'
    || pulse.saturationLevel === 'crowded'
    || pulse.saturationLevel === 'saturated';

  return {
    selectedDate: date,
    selectedTime: time,
    selectedCategory: category,
    selectedCity: city,
    pulse,
    calendar,
    suggestions,
    showCalendar,
  };
}
