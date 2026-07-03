/**
 * ECHO WebShell — root wrapper for every web page.
 * Locked v59 behavior:
 * - Charcoal base background.
 * - WebNav on top, WebFooter at bottom (both web-only).
 * - Scroll surface for the page content.
 * - Native mobile users never see this component (gated upstream).
 */
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { WebNav } from './WebNav';
import { WebFooter } from './WebFooter';

interface Props {
  children: React.ReactNode;
  /** Hide nav (used by portal/login shells). */
  hideNav?: boolean;
  /** Hide footer (used by checkout/portal). */
  hideFooter?: boolean;
  /** Adds a subtle ambient gradient blob behind content. */
  ambient?: boolean;
}

export function WebShell({ children, hideNav, hideFooter, ambient = true }: Props) {
  if (Platform.OS !== 'web') {
    // Native fallback should never reach here, but render children plain just in case.
    return <View style={{ flex: 1, backgroundColor: '#000' }}>{children}</View>;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient blobs — purely decorative, low cost */}
        {ambient && (
          <>
            <View style={styles.ambientBlobA} pointerEvents="none" />
            <View style={styles.ambientBlobB} pointerEvents="none" />
          </>
        )}
        {!hideNav && <WebNav />}
        <View style={styles.body}>{children}</View>
        {!hideFooter && <WebFooter />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#06060A' },
  scroll: { flex: 1 },
  scrollContent: { minHeight: '100%' },
  body: { width: '100%' },
  ambientBlobA: {
    position: 'absolute',
    top: -180,
    left: -160,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(123, 77, 255, 0.18)',
    opacity: 0.5,
    // @ts-ignore react-native-web supports filter
    filter: 'blur(120px)',
  },
  ambientBlobB: {
    position: 'absolute',
    top: 380,
    right: -240,
    width: 640,
    height: 640,
    borderRadius: 320,
    backgroundColor: 'rgba(32, 199, 255, 0.10)',
    opacity: 0.5,
    // @ts-ignore react-native-web supports filter
    filter: 'blur(140px)',
  },
});

export default WebShell;
