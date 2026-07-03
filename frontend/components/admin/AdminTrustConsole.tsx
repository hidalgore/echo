/**
 * components/admin/AdminTrustConsole.tsx
 * ══════════════════════════════════════
 * Internal Admin Trust & Safety console. Gate this route behind ECHO admin auth
 * before shipping (feature-flag: ADMIN_TRUST_CONSOLE). Shows the admin queue
 * and live risk feed from botRiskService.
 *
 * Doctrine: token-only, a11y on every interactive element, no emoji, no colour
 * as sole status signal — each status row carries icon + text + colour.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminQueues, AdminQueueItem } from '../../types/securityCenters';
import type { RiskDecision } from '../../services/botRiskService';
import { COLOR, RADIUS, SPACE, TYPE, TOUCH } from '../../theme/a11yTokens';
import { a11yButton } from '../../theme/a11y';

// ─── Props ───────────────────────────────────────────────────────────────────

export type AdminTrustConsoleProps = {
  queues: AdminQueues;
  riskFeed: RiskDecision[];
};

// ─── Sub-types ────────────────────────────────────────────────────────────────

type TabId = 'queues' | 'risk';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; color: string; glyph: string }> = {
  low:      { label: 'Low',      color: COLOR.success, glyph: '·' },
  medium:   { label: 'Medium',   color: COLOR.warning, glyph: '!' },
  high:     { label: 'High',     color: COLOR.danger,  glyph: '!!' },
  critical: { label: 'Critical', color: COLOR.danger,  glyph: '!!!' },
};

const ACTION_CONFIG: Record<string, { label: string; color: string; glyph: string }> = {
  allow:     { label: 'Allow',     color: COLOR.success, glyph: '✓' },
  challenge: { label: 'Challenge', color: COLOR.warning, glyph: '?' },
  block:     { label: 'Block',     color: COLOR.danger,  glyph: '⊘' },
};

const KIND_LABEL: Record<string, string> = {
  dispute: 'Dispute',
  trust_flag: 'Trust Flag',
  id_review: 'ID Review',
  refund_escalation: 'Refund Escalation',
};

const SUBJECT_LABEL: Record<string, string> = {
  checkout: 'Checkout',
  user: 'User',
  scanner: 'Scanner',
  transfer: 'Transfer',
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Queue item row ───────────────────────────────────────────────────────────

function QueueRow({ item }: { item: AdminQueueItem }) {
  const p = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium;
  return (
    <View style={s.row} accessible accessibilityLabel={`${KIND_LABEL[item.kind] ?? item.kind}, priority ${p.label}: ${item.summary}. ${formatRelative(item.createdAt)}.`}>
      <View style={s.rowLeft}>
        <View style={[s.priorityBadge, { borderColor: p.color }]}>
          <Text style={[s.priorityGlyph, { color: p.color }]} accessibilityElementsHidden>{p.glyph}</Text>
          <Text style={[s.priorityText, { color: p.color }]}>{p.label}</Text>
        </View>
        <Text style={s.kindLabel}>{KIND_LABEL[item.kind] ?? item.kind}</Text>
      </View>
      <Text style={s.rowSummary}>{item.summary}</Text>
      <View style={s.rowMeta}>
        {item.linkedUser ? <Text style={s.metaChip}>{item.linkedUser}</Text> : null}
        <Text style={s.metaTime}>{formatRelative(item.createdAt)}</Text>
      </View>
    </View>
  );
}

// ─── Risk feed row ────────────────────────────────────────────────────────────

function RiskRow({ d }: { d: RiskDecision }) {
  const a = ACTION_CONFIG[d.action] ?? ACTION_CONFIG.allow;
  return (
    <View style={s.row} accessible accessibilityLabel={`${SUBJECT_LABEL[d.subjectType] ?? d.subjectType} ${d.subjectId}, score ${d.score}, action: ${a.label}. ${d.summary}`}>
      <View style={s.rowLeft}>
        <View style={[s.actionBadge, { borderColor: a.color }]}>
          <Text style={[s.actionGlyph, { color: a.color }]} accessibilityElementsHidden>{a.glyph}</Text>
          <Text style={[s.actionText, { color: a.color }]}>{a.label}</Text>
        </View>
        <Text style={s.kindLabel}>{SUBJECT_LABEL[d.subjectType] ?? d.subjectType}</Text>
      </View>
      <Text style={s.rowSummary}>{d.subjectId}</Text>
      <View style={s.scoreRow}>
        <Text style={s.scoreLabel}>Score</Text>
        <Text style={[s.scoreValue, { color: a.color }]}>{d.score}</Text>
      </View>
      {d.reasons.length > 0 ? (
        <View style={s.reasons}>
          {d.reasons.map((r) => (
            <View key={r} style={s.reasonChip}>
              <Text style={s.reasonText}>{r.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, items }: { title: string; items: AdminQueueItem[] }) {
  if (items.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {items.map((item) => <QueueRow key={item.id} item={item} />)}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminTrustConsole({ queues, riskFeed }: AdminTrustConsoleProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('queues');

  const totalQueue =
    queues.disputes.length +
    queues.trustFlags.length +
    queues.idReviews.length +
    queues.refundEscalations.length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Trust Console</Text>
        <Text style={s.headerSub}>Internal — do not share</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs} accessibilityRole="tablist">
        {([
          { id: 'queues' as TabId, label: `Queues (${totalQueue})` },
          { id: 'risk'   as TabId, label: `Risk Feed (${riskFeed.length})` },
        ] as { id: TabId; label: string }[]).map(({ id, label }) => (
          <Pressable
            key={id}
            style={[s.tab, tab === id && s.tabActive]}
            onPress={() => setTab(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
            accessibilityLabel={label}
          >
            <Text style={[s.tabText, tab === id && s.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Body */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + SPACE[24] }}
        accessibilityRole="list"
      >
        {tab === 'queues' ? (
          <>
            <Section title="Trust Flags" items={queues.trustFlags} />
            <Section title="Disputes" items={queues.disputes} />
            <Section title="Refund Escalations" items={queues.refundEscalations} />
            <Section title="ID Reviews" items={queues.idReviews} />
            {totalQueue === 0 ? (
              <Text style={s.empty}>All queues clear.</Text>
            ) : null}
          </>
        ) : (
          <>
            {riskFeed.length === 0 ? (
              <Text style={s.empty}>No active risk signals.</Text>
            ) : (
              riskFeed.map((d, i) => <RiskRow key={`${d.subjectId}-${i}`} d={d} />)
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MIN = Platform.OS === 'android' ? TOUCH.androidMin : TOUCH.iosMin;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOR.dark },

  header: {
    paddingHorizontal: SPACE[16],
    paddingVertical: SPACE[12],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: TYPE['text-lg'].fontSize, fontWeight: '800', color: COLOR.on },
  headerSub: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2, marginTop: 2, letterSpacing: 0.4, textTransform: 'uppercase' },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    minHeight: MIN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE[12],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLOR.primaryCta },
  tabText: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on2, fontWeight: '600' },
  tabTextActive: { color: COLOR.on },

  scroll: { flex: 1 },

  section: { marginBottom: SPACE[24] },
  sectionTitle: {
    fontSize: TYPE['text-xs'].fontSize,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLOR.on2,
    marginBottom: SPACE[8],
  },

  row: {
    backgroundColor: COLOR.darkCard,
    borderRadius: RADIUS.md,
    padding: SPACE[16],
    marginBottom: SPACE[8],
    gap: SPACE[8],
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[8] },
  rowSummary: { fontSize: TYPE['text-sm'].fontSize, color: COLOR.on, lineHeight: TYPE['text-sm'].lineHeight },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACE[8], flexWrap: 'wrap' },

  priorityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[8], paddingVertical: 4,
  },
  priorityGlyph: { fontSize: 10, fontWeight: '800' },
  priorityText: { fontSize: TYPE['text-xs'].fontSize, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  actionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[8], paddingVertical: 4,
  },
  actionGlyph: { fontSize: 10, fontWeight: '800' },
  actionText: { fontSize: TYPE['text-xs'].fontSize, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  kindLabel: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2, fontWeight: '600' },

  metaChip: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[8], paddingVertical: 2,
    fontSize: TYPE['text-xs'].fontSize,
    color: COLOR.on2,
  },
  metaTime: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[8] },
  scoreLabel: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  scoreValue: { fontSize: TYPE['text-lg'].fontSize, fontWeight: '800' },

  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[4] },
  reasonChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE[8], paddingVertical: 4,
  },
  reasonText: { fontSize: TYPE['text-xs'].fontSize, color: COLOR.on2 },

  empty: { fontSize: TYPE['text-md'].fontSize, color: COLOR.on2, textAlign: 'center', marginTop: SPACE[48] },
});
