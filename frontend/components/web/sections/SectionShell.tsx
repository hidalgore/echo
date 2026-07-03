/**
 * ECHO — SectionShell (v59.4, web)
 * ═════════════════════════════════
 * Shared section container for the website. Enforces the v59.x editorial
 * rhythm: max-width 1160, consistent paddings, eyebrow → title → subtitle
 * hierarchy, optional alternating band tint.
 *
 * StyleSheet values are static literals per theme doctrine
 * (token-equivalent: grid 8/16/24, radii.lg 16, bg #0F1115).
 */
import React, { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../ui/Text';

interface SectionShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  band?: boolean;          // alternating band tint
  align?: 'left' | 'center';
  nativeID?: string;       // anchor target for header nav (#trust, #disc...)
}

export function SectionShell({
  eyebrow, title, subtitle, children, band = false, align = 'left', nativeID,
}: SectionShellProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const centered = align === 'center';

  return (
    <View nativeID={nativeID} style={[styles.band, band && styles.bandTint]}>
      <View
        style={[
          styles.container,
          { paddingVertical: isMobile ? 64 : 104, paddingHorizontal: isMobile ? 20 : 32 },
        ]}
      >
        <View style={[styles.headerBlock, centered && styles.headerCentered]}>
          {eyebrow ? (
            <Text variant="label" style={[styles.eyebrow, centered && styles.textCenter]}>
              {eyebrow}
            </Text>
          ) : null}
          <Text
            variant="displayM"
            accessibilityRole="header"
            style={[styles.title, isMobile && styles.titleMobile, centered && styles.textCenter]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" style={[styles.subtitle, centered && styles.textCenter]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    width: '100%',
    backgroundColor: '#0F1115',
  },
  bandTint: {
    backgroundColor: '#12151B',
  },
  container: {
    width: '100%',
    maxWidth: 1160,
    alignSelf: 'center',
  },
  headerBlock: {
    marginBottom: 40,
    maxWidth: 720,
  },
  headerCentered: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  eyebrow: {
    color: '#FFB45C',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontSize: 13,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: 16,
  },
  titleMobile: {
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 17,
    lineHeight: 26,
  },
  textCenter: {
    textAlign: 'center',
  },
});
