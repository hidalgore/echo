/**
 * AI Card Shared Styles
 * ═════════════════════
 * Premium frosted card system for all HOST AI surfaces.
 * Dark charcoal, frosted glass, subtle gradients, 24 radius.
 */
import { StyleSheet } from 'react-native';

export const AI_COLORS = {
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  eyebrow: 'rgba(32,199,255,0.80)',
  sparkle: '#20C7FF',
  textHigh: '#F5F7FB',
  textMid: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  affirm: '#10B981',
  gradientStart: 'rgba(32,199,255,0.12)',
  gradientEnd: 'rgba(123,77,255,0.08)',
};

export const aiCard = StyleSheet.create({
  container: {
    backgroundColor: AI_COLORS.cardBg,
    borderWidth: 1,
    borderColor: AI_COLORS.cardBorder,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: AI_COLORS.eyebrow,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  mainInsight: {
    fontSize: 16,
    fontWeight: '600',
    color: AI_COLORS.textHigh,
    lineHeight: 24,
    marginBottom: 6,
  },
  supportLine: {
    fontSize: 14,
    color: AI_COLORS.textMid,
    lineHeight: 20,
    marginBottom: 18,
  },
  ctaBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(32,199,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(32,199,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#20C7FF',
  },
  secondaryLink: {
    fontSize: 13,
    color: AI_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AI_COLORS.textHigh,
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: AI_COLORS.textMid,
    lineHeight: 20,
  },
  shimmer: {
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 10,
  },
});
