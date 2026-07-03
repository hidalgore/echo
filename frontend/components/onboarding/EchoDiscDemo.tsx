/**
 * EchoDiscDemo — concentric access ring used in the Access Demo.
 * Presentational SVG. Color reflects scan phase; the optional pulse is applied
 * by the parent via a transform on an Animated.View (reduce-motion safe).
 */
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useDynamicTheme } from '../../theme/dynamicTheme';

export type DiscPhase = 'idle' | 'scanning' | 'granted';

interface Props {
  phase: DiscPhase;
  size?: number;
}

export function EchoDiscDemo({ phase, size = 132 }: Props) {
  const { colors: c } = useDynamicTheme();
  const ring =
    phase === 'granted' ? c.success : phase === 'scanning' ? c.accent : c.hairlineStrong;
  const center = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={center - 4} stroke={ring} strokeWidth={2} fill="none" opacity={0.35} />
        <Circle cx={center} cy={center} r={center - 22} stroke={ring} strokeWidth={3} fill="none" opacity={0.6} />
        <Circle cx={center} cy={center} r={center - 44} stroke={ring} strokeWidth={4} fill="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
