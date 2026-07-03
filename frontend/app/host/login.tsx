/**
 * /host/login — Host portal sign-in page.
 *
 * Locked v59 behavior:
 * - Uses shared PortalShell (audience="host").
 * - Side panel shows HostCommandPreview (compact) so hosts know what they're signing into.
 * - Mock-only auth: Continue routes to /host/dashboard.
 * - Cross-links to /login for attendee sign-in.
 */
import React from 'react';
import { Platform } from 'react-native';
import { PortalShell } from '../../components/web/PortalShell';
import { HostCommandPreview } from '../../components/web/HostCommandPreview';

export default function HostLoginPage() {
  if (Platform.OS !== 'web') return null;
  return (
    <PortalShell
      audience="host"
      sidePanel={<HostCommandPreview compact />}
    />
  );
}
