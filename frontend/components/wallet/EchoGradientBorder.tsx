import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const echoWalletGradient = ['#149CFF', '#7657FF', '#E238B8', '#FF8A1F'];

export function EchoGradientBorder({ children, style, innerStyle, radius = 28, stroke = 1.25 }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  radius?: number;
  stroke?: number;
}) {
  return (
    <LinearGradient
      colors={echoWalletGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius, padding: stroke }, style]}
    >
      <View style={[{ borderRadius: radius - stroke, overflow: 'hidden' }, innerStyle]}>
        {children}
      </View>
    </LinearGradient>
  );
}
