import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export function EchoStandaloneIcon({ size = 70, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={require('../../assets/images/echo_icon_mark.png')} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
