/**
 * /trust-center — ECHO Trust Center (web-gated).
 * NOTE: the locked public /trust page lives in app/trust.tsx and is unchanged.
 * This surfaces components/security/TrustCenter at a distinct, non-colliding path.
 */
import React from 'react';
import { Platform, View } from 'react-native';
import { Text } from '../components/ui';
import TrustCenter from '../components/security/TrustCenter';

export default function TrustCenterRoute() {
  if (Platform.OS === 'web') return <TrustCenter />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text variant="body">The ECHO Trust Center is available on the web.</Text>
    </View>
  );
}
