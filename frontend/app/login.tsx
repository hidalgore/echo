/**
 * /login — Attendee portal sign-in page.
 *
 * Locked v59 behavior:
 * - Uses shared PortalShell (audience="attendee").
 * - Side panel shows ECHO Access Pass preview (charcoal — no ticket).
 * - Mock-only auth: Continue routes to /wallet.
 * - Cross-links to /host/login for host sign-in.
 */
import React from 'react';
import { Platform } from 'react-native';
import { PortalShell } from '../components/web/PortalShell';
import { EchoAccessPassPreview } from '../components/web/EchoAccessPassPreview';

export default function LoginPage() {
  if (Platform.OS !== 'web') return null;
  return (
    <PortalShell
      audience="attendee"
      sidePanel={<EchoAccessPassPreview />}
    />
  );
}
