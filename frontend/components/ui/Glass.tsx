import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, radii } from '../../theme/tokens';

interface Props extends ViewProps {
  children: React.ReactNode;
}

export function Glass({ style, children, ...props }: Props) {
  return (
    <View style={[styles.glass, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    // NO glow, NO shadows per spec
  },
});
