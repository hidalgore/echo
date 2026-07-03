import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { radii } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';

interface Props extends ViewProps {
  children: React.ReactNode;
}

export function Card({ style, children, ...props }: Props) {
  const { colors: c } = useDynamicTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.hairline }, c.cardShadow as ViewStyle, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.eventCard,
    borderWidth: 1,
  },
});
