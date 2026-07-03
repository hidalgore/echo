import React from 'react';
import { View, StyleSheet, Image, ImageStyle, StyleProp } from 'react-native';

export function EchoNfcGlyph({ size = 42, active = true, style }: { size?: number; active?: boolean; style?: StyleProp<ImageStyle> }) {
  return (
    <View style={[s.wrap, { width: size, height: size, borderRadius: size / 2, opacity: active ? 1 : 0.45 }]}> 
      <Image source={require('../../assets/images/echo_nfc_mark.png')} style={[{ width: size * 0.72, height: size * 0.72 }, style]} resizeMode="contain" />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,156,255,0.10)', borderWidth: 1, borderColor: 'rgba(20,156,255,0.26)' },
});
