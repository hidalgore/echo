/**
 * app/security/privacy.tsx — Attendee Privacy & Security.
 * NEW top-level route (NOT under app/profile/*) so it never touches the
 * protected profile screens. Link to it from the profile menu.
 */
import React, { useState } from 'react';
import AttendeePrivacySecurity from '../../components/security/AttendeePrivacySecurity';
import type { AttendeeSecurityState, PrivacyControls } from '../../types/securityCenters';
import { defaultPrivacyControls, tuneMyEchoDefaults, mockTrustedDevices, mockLoginHistory } from '../../services/securityCenterService';

export default function AttendeePrivacyRoute() {
  const [security, setSecurity] = useState<AttendeeSecurityState>({ passkeyEnabled: true, mfaEnabled: true, ticketTransferProtection: true, newDeviceAlerts: true });
  const [privacy, setPrivacy] = useState<PrivacyControls>(defaultPrivacyControls());
  const [recs, setRecs] = useState(tuneMyEchoDefaults());
  return (
    <AttendeePrivacySecurity
      security={security} privacy={privacy} recommendations={recs}
      devices={mockTrustedDevices()} loginHistory={mockLoginHistory()}
      onToggleSecurity={(k, v) => setSecurity((s) => ({ ...s, [k]: v }))}
      onTogglePrivacy={(k, v) => setPrivacy((p) => ({ ...p, [k]: v }))}
      onToggleRecommendation={(id, v) => setRecs((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: v } : r)))}
    />
  );
}
