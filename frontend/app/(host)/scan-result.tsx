/**
 * /(host)/scan-result — Door scan RESULT surface.
 * Build decision 3B: the accessibility-enhanced DoorScanResultScreen is the
 * routed scan-result screen. Shown with a representative result; the live door
 * flow should navigate here with the real DoorModeResultView after each tap.
 */
import React from 'react';
import { router } from 'expo-router';
import { DoorScanResultScreenA11y } from '../../components/door/DoorScanResultScreen.a11y';
import type { DoorModeResultView } from '../../services/accessControlService';

const DEMO_RESULT: DoorModeResultView = {
  approved: true,
  decisionLabel: 'Access Granted',
  colorToken: 'vip',
  hapticPattern: 'success',
  guestName: 'Jordan Avery',
  tierId: 'vip',
  tierLabel: 'VIP',
  checkpointLabel: 'Main Entrance',
  authorizedAreas: ['General Admission', 'VIP Lounge'],
  verificationState: 'verified',
  suggestedStaffAction: 'Allow entry.',
  showVipArrivalAlert: true,
};

export default function ScanResultRoute() {
  return <DoorScanResultScreenA11y result={DEMO_RESULT} onNextScan={() => router.back()} />;
}
