/**
 * Scheduling Intelligence Components
 * ═══════════════════════════════════
 * Market Pulse card, Smart Reschedule Calendar, and alternative suggestions.
 * Integrated into event creation after category/location/date/time selection.
 */
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui';
import { colors, radius } from '../../../theme/hostTokens';
import type {
  MarketPulseResult, CalendarDay, SchedulingSuggestion,
  SchedulingIntelligenceResult, SaturationLevel, DayColor,
} from '../../../types/dashboard';

// ═══════════════════════════════════════════════════════════════════
// MARKET PULSE CARD
// ═══════════════════════════════════════════════════════════════════

export function MarketPulseCard({
  pulse,
  onDismiss,
}: {
  pulse: MarketPulseResult;
  onDismiss?: () => void;
}) {
  const config = SAT_CONFIG[pulse.saturationLevel];

  return (
    <View style={[ms.card, { borderColor: `${config.color}18` }]}>
      {/* Header */}
      <View style={ms.headerRow}>
        <View style={ms.headerLeft}>
          <Ionicons name="pulse" size={14} color={config.color} />
          <Text style={ms.eyebrow}>MARKET PULSE</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="close" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Saturation gauge */}
      <View style={ms.gaugeRow}>
        <View style={[ms.gaugePill, { backgroundColor: `${config.color}14` }]}>
          <View style={[ms.gaugeDot, { backgroundColor: config.color }]} />
          <Text style={[ms.gaugeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={ms.gaugeScore}>{pulse.saturationScore}/100 saturation</Text>
      </View>

      {/* Metrics row */}
      <View style={ms.metricsRow}>
        <MiniStat label="Nearby Events" value={`${pulse.nearbyEventCount}`} />
        <MiniStat label="Direct Overlap" value={`${pulse.directOverlapCount}`} warn={pulse.directOverlapCount >= 2} />
        <MiniStat label="Uniqueness" value={`${pulse.localUniqueness}`} />
        <MiniStat label="Opportunity" value={`${pulse.opportunityScore}`} />
      </View>

      {/* Time slot pressure */}
      <View style={ms.pressureRow}>
        <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
        <Text style={ms.pressureText}>Time-slot pressure: <Text style={{ color: config.color, fontWeight: '700' }}>{pulse.timeSlotPressure}</Text></Text>
      </View>

      {/* Insight */}
      <View style={ms.insightWrap}>
        <Ionicons name="sparkles" size={13} color="rgba(32,199,255,0.70)" />
        <Text style={ms.insightText}>{pulse.insightText}</Text>
      </View>

      {/* Recommendation */}
      <Text style={ms.recommendation}>{pulse.recommendation}</Text>

      {/* Nearby events preview */}
      {pulse.nearbyEvents.filter((e) => e.similarityType === 'direct').length > 0 && (
        <View style={ms.nearbyWrap}>
          <Text style={ms.nearbyLabel}>Competing events</Text>
          {pulse.nearbyEvents
            .filter((e) => e.similarityType === 'direct')
            .slice(0, 3)
            .map((e) => (
              <View key={e.id} style={ms.nearbyRow}>
                <View style={ms.nearbyDot} />
                <View style={ms.nearbyContent}>
                  <Text style={ms.nearbyTitle} numberOfLines={1}>{e.title}</Text>
                  <Text style={ms.nearbyMeta}>{e.venue} {'\u00b7'} {e.distanceMiles}mi</Text>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={ms.miniStat}>
      <Text style={ms.miniLabel}>{label}</Text>
      <Text style={[ms.miniValue, warn && { color: colors.accentAmber }]}>{value}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SMART RESCHEDULE CALENDAR
// ═══════════════════════════════════════════════════════════════════

export function SmartRescheduleCalendar({
  days,
  selectedDate,
  onSelectDate,
}: {
  days: CalendarDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <View style={cs.wrap}>
      <View style={cs.headerRow}>
        <Ionicons name="calendar" size={14} color={colors.accentCyan} />
        <Text style={cs.eyebrow}>SCHEDULING INTELLIGENCE</Text>
      </View>
      <Text style={cs.subtitle}>Tap a day to see competition details. Green days have less competition.</Text>

      {/* Calendar grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cs.calGrid}>
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          const bgColor = DAY_COLORS[day.color];

          return (
            <TouchableOpacity
              key={day.date}
              style={[cs.dayCell, isSelected && cs.dayCellSelected]}
              onPress={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
              activeOpacity={0.82}
            >
              <Text style={cs.dayDow}>{day.dayOfWeek}</Text>
              <View style={[cs.dayDot, { backgroundColor: bgColor }]} />
              <Text style={[cs.dayNum, isSelected && { color: colors.accentCyan }]}>
                {day.date.split('-')[2]}
              </Text>
              {isSelected && <Text style={cs.dayCurrentLabel}>Current</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={cs.legendRow}>
        <LegendItem color={DAY_COLORS.dark_green} label="Best" />
        <LegendItem color={DAY_COLORS.green} label="Good" />
        <LegendItem color={DAY_COLORS.amber} label="Moderate" />
        <LegendItem color={DAY_COLORS.red} label="Competitive" />
      </View>

      {/* Day detail drilldown */}
      {expandedDay && (() => {
        const day = days.find((d) => d.date === expandedDay);
        if (!day) return null;
        return (
          <View style={cs.detailCard}>
            <Text style={cs.detailTitle}>
              {day.dayOfWeek}, {day.date.split('-')[1]}/{day.date.split('-')[2]}
            </Text>
            <View style={cs.detailRow}>
              <Text style={cs.detailLabel}>Similar events</Text>
              <Text style={cs.detailValue}>{day.similarEventCount}</Text>
            </View>
            <View style={cs.detailRow}>
              <Text style={cs.detailLabel}>Direct overlap</Text>
              <Text style={[cs.detailValue, day.directOverlapCount > 0 && { color: colors.accentAmber }]}>{day.directOverlapCount}</Text>
            </View>
            <View style={cs.detailRow}>
              <Text style={cs.detailLabel}>Peak crowding</Text>
              <Text style={cs.detailValue}>{day.peakCrowdingWindow}</Text>
            </View>
            <View style={cs.detailRow}>
              <Text style={cs.detailLabel}>Best time windows</Text>
              <Text style={cs.detailValue}>{day.bestTimeWindows.join(', ')}</Text>
            </View>
            <Text style={cs.detailRationale}>{day.rationale}</Text>
            {day.date !== selectedDate && (
              <TouchableOpacity style={cs.selectBtn} onPress={() => onSelectDate(day.date)} activeOpacity={0.85}>
                <Text style={cs.selectBtnText}>Use this date</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })()}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={cs.legendItem}>
      <View style={[cs.legendDot, { backgroundColor: color }]} />
      <Text style={cs.legendText}>{label}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ALTERNATIVE TIME SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════

export function AlternativeTimeSuggestions({
  suggestions,
  onSelect,
  onKeepCurrent,
}: {
  suggestions: SchedulingSuggestion[];
  onSelect: (date: string, time: string) => void;
  onKeepCurrent: () => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <View style={as.wrap}>
      <Text style={as.title}>Better timing options</Text>
      <Text style={as.subtitle}>These alternatives have less competition in your market.</Text>

      {suggestions.map((sug) => (
        <TouchableOpacity
          key={sug.date}
          style={as.suggCard}
          onPress={() => onSelect(sug.date, sug.time)}
          activeOpacity={0.85}
        >
          <View style={as.suggTop}>
            <Text style={as.suggDate}>{sug.dayOfWeek} {sug.date.split('-')[1]}/{sug.date.split('-')[2]}</Text>
            <View style={as.suggBadge}>
              <Text style={as.suggBadgeText}>{sug.competitionReduction}</Text>
            </View>
          </View>
          <Text style={as.suggTime}>{sug.time}</Text>
          <Text style={as.suggReason}>{sug.reason}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={as.keepBtn} onPress={onKeepCurrent} activeOpacity={0.82}>
        <Text style={as.keepText}>Keep current date</Text>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FULL SCHEDULING INTELLIGENCE PANEL
// ═══════════════════════════════════════════════════════════════════

export function SchedulingIntelligencePanel({
  result,
  onSelectDate,
  onKeepCurrent,
}: {
  result: SchedulingIntelligenceResult;
  onSelectDate: (date: string, time: string) => void;
  onKeepCurrent: () => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <MarketPulseCard pulse={result.pulse} />
      {result.showCalendar && (
        <SmartRescheduleCalendar
          days={result.calendar}
          selectedDate={result.selectedDate}
          onSelectDate={(date) => onSelectDate(date, result.selectedTime)}
        />
      )}
      {result.suggestions.length > 0 && (
        <AlternativeTimeSuggestions
          suggestions={result.suggestions}
          onSelect={onSelectDate}
          onKeepCurrent={onKeepCurrent}
        />
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COLOR MAPS
// ═══════════════════════════════════════════════════════════════════

const SAT_CONFIG: Record<SaturationLevel, { label: string; color: string }> = {
  low: { label: 'Low Competition', color: '#10B981' },
  moderate: { label: 'Moderate Competition', color: '#3B82F6' },
  high: { label: 'High Competition', color: '#F59E0B' },
  crowded: { label: 'Crowded Market', color: '#EF4444' },
  saturated: { label: 'Saturated', color: '#EF4444' },
};

const DAY_COLORS: Record<DayColor, string> = {
  dark_green: '#059669',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
};

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

const ms = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderRadius: radius.xl, padding: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase' },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  gaugePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  gaugeDot: { width: 6, height: 6, borderRadius: 3 },
  gaugeText: { fontSize: 12, fontWeight: '700' },
  gaugeScore: { color: colors.textTertiary, fontSize: 12 },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  miniStat: { flex: 1 },
  miniLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  miniValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  pressureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  pressureText: { color: colors.textSecondary, fontSize: 13 },
  insightWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: 'rgba(32,199,255,0.03)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.06)', marginBottom: 12 },
  insightText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  recommendation: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  nearbyWrap: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  nearbyLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  nearbyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  nearbyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accentAmber },
  nearbyContent: { flex: 1 },
  nearbyTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  nearbyMeta: { color: colors.textTertiary, fontSize: 11 },
});

const cs = StyleSheet.create({
  wrap: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: radius.xl, padding: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: colors.textTertiary, letterSpacing: 1.2, textTransform: 'uppercase' },
  subtitle: { color: colors.textTertiary, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  calGrid: { gap: 6, paddingBottom: 8 },
  dayCell: { width: 52, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  dayCellSelected: { borderColor: 'rgba(32,199,255,0.30)', backgroundColor: 'rgba(32,199,255,0.04)' },
  dayDow: { color: colors.textTertiary, fontSize: 10, fontWeight: '600', marginBottom: 6 },
  dayDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dayNum: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  dayCurrentLabel: { color: colors.accentCyan, fontSize: 8, fontWeight: '700', marginTop: 4 },
  legendRow: { flexDirection: 'row', gap: 14, marginTop: 8, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: colors.textTertiary, fontSize: 10 },
  detailCard: { marginTop: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  detailTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: colors.textTertiary, fontSize: 13 },
  detailValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  detailRationale: { color: colors.textTertiary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  selectBtn: { marginTop: 12, height: 40, borderRadius: 20, backgroundColor: 'rgba(32,199,255,0.12)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  selectBtnText: { color: '#20C7FF', fontSize: 14, fontWeight: '700' },
});

const as = StyleSheet.create({
  wrap: { gap: 10 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.textTertiary, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  suggCard: { padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  suggTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  suggDate: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  suggBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.12)' },
  suggBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  suggTime: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  suggReason: { color: colors.textTertiary, fontSize: 12, lineHeight: 17 },
  keepBtn: { height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  keepText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
