/**
 * ECHO Host Command Preview — browser-frame product visual.
 *
 * Used on homepage hero and Host landing page to show the dashboard.
 * No real data — purely a mock visual built from styled rectangles.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '../../theme/brand';

interface Props {
  compact?: boolean;
}

export function HostCommandPreview({ compact = false }: Props) {
  return (
    <View style={[styles.browserOuter, compact && styles.browserOuterCompact]}>
      {/* Glow ring */}
      <LinearGradient
        colors={[brand.cyan + '33', brand.primary + '22', brand.magenta + '22', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glow}
      />

      <View style={styles.browserWindow}>
        {/* Browser chrome */}
        <View style={styles.chromeBar}>
          <View style={styles.trafficLights}>
            <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
            <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
            <View style={[styles.dot, { backgroundColor: '#28C840' }]} />
          </View>
          <View style={styles.addressPill}>
            <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.65)" />
            <Text style={styles.addressText}>echo.app / host / dashboard</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Dashboard body */}
        <View style={styles.dashBody}>
          {/* Sidebar */}
          <View style={styles.sidebar}>
            <View style={styles.sidebarBrand}>
              <View style={styles.sidebarBrandDot} />
              <View style={styles.sidebarBrandLine} />
            </View>
            {['grid', 'calendar', 'people', 'pulse', 'cash', 'settings'].map((k) => (
              <View key={k} style={styles.sidebarItem}>
                <View style={styles.sidebarIconBox} />
              </View>
            ))}
          </View>

          {/* Main panel */}
          <View style={styles.mainPanel}>
            {/* Top KPIs */}
            <View style={styles.kpiRow}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Tickets sold</Text>
                <Text style={styles.kpiValue}>482</Text>
                <View style={styles.kpiBar}>
                  <LinearGradient
                    colors={[brand.cyan, brand.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.kpiBarFill, { width: '74%' }]}
                  />
                </View>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Revenue</Text>
                <Text style={styles.kpiValue}>$28.4K</Text>
                <View style={styles.kpiBar}>
                  <LinearGradient
                    colors={[brand.primary, brand.magenta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.kpiBarFill, { width: '62%' }]}
                  />
                </View>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Check-in ready</Text>
                <Text style={styles.kpiValue}>92%</Text>
                <View style={styles.kpiBar}>
                  <LinearGradient
                    colors={[brand.cyan, brand.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.kpiBarFill, { width: '92%' }]}
                  />
                </View>
              </View>
            </View>

            {/* Body grid: chart + list */}
            <View style={styles.bodyGrid}>
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Sales velocity · 7d</Text>
                  <View style={styles.chartChip}>
                    <View style={styles.chartChipDot} />
                    <Text style={styles.chartChipText}>+18%</Text>
                  </View>
                </View>
                {/* Fake bar chart */}
                <View style={styles.chartBars}>
                  {[24, 38, 32, 60, 48, 72, 88].map((h, i) => (
                    <View key={i} style={styles.chartBarCol}>
                      <LinearGradient
                        colors={[brand.primary + '88', brand.cyan + '66']}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[styles.chartBar, { height: h }]}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.listCard}>
                <Text style={styles.listTitle}>Door queue · live</Text>
                {[
                  { name: 'Marcus C.', tier: 'GA', state: 'ok' },
                  { name: 'Jane P.', tier: 'VIP', state: 'ok' },
                  { name: 'Alex R.', tier: 'GA', state: 'warn' },
                  { name: 'Diego T.', tier: 'Circle', state: 'ok' },
                ].map((row, i) => (
                  <View key={i} style={styles.listRow}>
                    <View style={styles.listAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName}>{row.name}</Text>
                      <Text style={styles.listMeta}>{row.tier}</Text>
                    </View>
                    <View style={[styles.statusDot, row.state === 'warn' ? styles.statusWarn : styles.statusOk]} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  browserOuter: {
    width: '100%',
    maxWidth: 820,
    aspectRatio: 1.55,
    position: 'relative',
  },
  browserOuterCompact: { maxWidth: 560 },
  glow: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    borderRadius: 60,
    opacity: 0.55,
  },
  browserWindow: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0A0A0E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chromeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  trafficLights: { flexDirection: 'row', gap: 6, width: 60 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    maxWidth: 320,
  },
  addressText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
  dashBody: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 56,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  sidebarBrand: { alignItems: 'center', gap: 4, marginBottom: 8 },
  sidebarBrandDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: brand.primary },
  sidebarBrandLine: { width: 22, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  sidebarItem: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sidebarIconBox: { width: 14, height: 14, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  mainPanel: { flex: 1, padding: 18, gap: 14 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  kpiLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  kpiValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  kpiBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  kpiBarFill: { height: 4, borderRadius: 2 },
  bodyGrid: { flex: 1, flexDirection: 'row', gap: 10 },
  chartCard: {
    flex: 1.4,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  chartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  chartChipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981' },
  chartChipText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
  chartBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  chartBarCol: { flex: 1, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 8 },
  listCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  listTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  listName: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  listMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusOk: { backgroundColor: '#10B981' },
  statusWarn: { backgroundColor: brand.gold },
});

export default HostCommandPreview;
