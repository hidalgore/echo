/**
 * ECHO WebSection — max-width centered section container.
 *
 * Provides consistent section padding + max content width across all web pages.
 * Optional eyebrow / title / description renders an editorial section header.
 */
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

interface Props {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: 'left' | 'center';
  maxWidth?: number;
  paddingVertical?: number;
  /** Subtle top border separator */
  divider?: boolean;
  /** Inverted: use light-on-charcoal contrast styling adjustments */
  tone?: 'default' | 'subtle';
}

export function WebSection({
  children,
  eyebrow,
  title,
  description,
  align = 'left',
  maxWidth = 1200,
  paddingVertical,
  divider,
  tone = 'default',
}: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const padY = paddingVertical ?? (compact ? 56 : 96);

  return (
    <View style={[styles.outer, { paddingVertical: padY }, divider && styles.divider, tone === 'subtle' && styles.subtle]}>
      <View style={[styles.inner, { maxWidth }, align === 'center' && styles.alignCenter]}>
        {(eyebrow || title || description) && (
          <View style={[styles.header, align === 'center' && styles.headerCenter]}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: '100%', paddingHorizontal: 24 },
  inner: { alignSelf: 'center', width: '100%' },
  alignCenter: { alignItems: 'center' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  subtle: { backgroundColor: 'rgba(255,255,255,0.015)' },
  header: { marginBottom: 32, maxWidth: 720 },
  headerCenter: { alignItems: 'center' },
  eyebrow: {
    color: 'rgba(123,77,255,0.95)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: { color: '#FFFFFF', fontSize: 38, fontWeight: '700', letterSpacing: -0.5, lineHeight: 46 },
  titleCompact: { fontSize: 28, lineHeight: 34 },
  description: { color: 'rgba(255,255,255,0.62)', fontSize: 17, lineHeight: 26, marginTop: 14, maxWidth: 640 },
});

export default WebSection;
