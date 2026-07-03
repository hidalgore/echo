import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui';
import { EchoGradientBorder } from './EchoGradientBorder';
import { EchoStandaloneIcon } from './EchoStandaloneIcon';
import { EchoLogoMark } from './EchoLogoMark';
import type { EchoWalletPass } from '../../services/appleWalletPassService';
import { STATUS_COPY } from '../../services/appleWalletPassService';

export function EchoWatchPassPreview({ pass }: { pass: EchoWalletPass }) {
  const copy = STATUS_COPY[pass.status];
  return (
    <View style={s.watchShell}>
      <View style={s.watchScreen}>
        <View style={s.watchTop}><EchoLogoMark width={48} height={18} /><Text style={s.time}>9:41</Text></View>
        <EchoGradientBorder radius={18} stroke={1.1} style={s.iconCard}>
          <View style={s.iconInner}><EchoStandaloneIcon size={70} /></View>
        </EchoGradientBorder>
        <Text style={s.ready}>{copy.main === 'Ready to Tap' ? 'Ready to Tap' : copy.main}</Text>
        <Text style={s.active}>⌾ {pass.status === 'ready' ? 'ACTIVE' : copy.sub}</Text>
        <Text style={s.hold}>Hold Near Reader</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  watchShell: { width: 158, height: 198, borderRadius: 42, padding: 8, backgroundColor: '#202229', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  watchScreen: { flex: 1, borderRadius: 34, padding: 13, backgroundColor: '#05060A', alignItems: 'center' },
  watchTop: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: '#F5F6FA', fontSize: 12, fontWeight: '700' },
  iconCard: { width: '100%', height: 82, marginTop: 12 },
  iconInner: { flex: 1, backgroundColor: '#101217', alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  ready: { color: '#F5F6FA', fontSize: 19, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  active: { color: '#A7F3D0', fontSize: 11, fontWeight: '900', marginTop: 4 },
  hold: { color: '#747887', fontSize: 11, marginTop: 8 },
});
