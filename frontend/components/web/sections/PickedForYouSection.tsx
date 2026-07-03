/**
 * ECHO — PickedForYouSection (v59.4, web)
 * ════════════════════════════════════════
 * "Picked for You — Curated by ECHO AI." Calm, explainable discovery.
 * Wired to the real rule-based scorer (services/pickedForYouScoring)
 * over mock data, so the website rail demonstrates the actual MVP logic.
 *
 * Copy rule: only REASON_LABELS strings render. Never dwell/scroll
 * mechanics in user-facing text.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/Text';
import { SectionShell } from './SectionShell';
import { WebEventCard } from '../WebEventCard';
import { rankPickedForYou } from '../../../services/pickedForYouScoring';
import { WEB_MOCK_EVENTS, WEB_MOCK_SIGNALS } from '../../../data/webMockEvents';

export function PickedForYouSection() {
  const picks = useMemo(() => {
    const ranked = rankPickedForYou(WEB_MOCK_EVENTS, WEB_MOCK_SIGNALS, 6);
    return ranked
      .map((r) => ({
        result: r,
        event: WEB_MOCK_EVENTS.find((e) => e.id === r.eventId),
      }))
      .filter((p): p is { result: (typeof ranked)[number]; event: (typeof WEB_MOCK_EVENTS)[number] } =>
        Boolean(p.event),
      );
  }, []);

  return (
    <SectionShell
      nativeID="picked"
      eyebrow="Curated by ECHO AI"
      title="Picked for You"
      subtitle="ECHO learns from what attendees genuinely care about — the events they buy, save, and return to — and quietly surfaces what fits next. Discovery that feels considered, never hectic."
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        accessibilityLabel="Picked for You: a horizontal rail of recommended events, each labeled with why it was picked."
      >
        {picks.map(({ result, event }) => (
          <WebEventCard
            key={event.id}
            event={event}
            reasonLabel={result.primaryReasonLabel}
          />
        ))}
      </ScrollView>

      <View style={styles.footNote}>
        <View style={styles.footDot} />
        <Text variant="caption" style={styles.footText}>
          Every recommendation states its reason in plain language. Hiding an event removes it — and ECHO listens.
        </Text>
      </View>
    </SectionShell>
  );
}

const styles = StyleSheet.create({
  rail: { gap: 16, paddingRight: 24, paddingBottom: 8 },
  footNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  footDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#20C7FF' },
  footText: { color: 'rgba(255,255,255,0.55)', flex: 1, lineHeight: 18 },
});
