import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export function EchoLogoMark({ width = 128, height = 42, style }: { width?: number; height?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={require('../../assets/images/echo_wordmark.png')} style={[{ width, height }, style]} resizeMode="contain" />;
}
