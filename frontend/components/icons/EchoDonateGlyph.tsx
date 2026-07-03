import React from 'react';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

/**
 * EchoDonateGlyph
 * ═══════════════
 * Heart-in-hand icon for events with active nonprofit donation campaigns.
 * Drop-in replacement for Ionicons "heart-outline" in donation indicator.
 *
 * - 24x24 viewBox; scales to any `size` prop
 * - `active=true` → ECHO gradient stroke (cyan → purple → pink) with subtle signal arcs
 * - `active=false` → monochrome muted stroke for inactive state
 * - Always renders the hand + heart + ECHO soft signal arcs (matches brand glyph)
 */

interface EchoDonateGlyphProps {
  size?: number;
  active?: boolean;
  /** Override stroke color when not active */
  color?: string;
}

export function EchoDonateGlyph({ size = 20, active = true, color = 'rgba(245,247,251,0.66)' }: EchoDonateGlyphProps) {
  const heartStroke = active ? 'url(#donateHeartGrad)' : color;
  const handStroke = active ? 'url(#donateHandGrad)' : color;
  const arcStroke = active ? 'url(#donateArcGrad)' : color;
  const sw = 1.7;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgGradient id="donateHeartGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#20C7FF" />
          <Stop offset="0.55" stopColor="#7B4DFF" />
          <Stop offset="1" stopColor="#E63DAD" />
        </SvgGradient>
        <SvgGradient id="donateHandGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#20C7FF" />
          <Stop offset="1" stopColor="#7B4DFF" />
        </SvgGradient>
        <SvgGradient id="donateArcGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#20C7FF" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#20C7FF" stopOpacity="0.0" />
        </SvgGradient>
      </Defs>

      {/* ECHO signal arcs (left side of heart) */}
      <Path
        d="M5.2 9.2 a3.4 3.4 0 0 0 0 4"
        stroke={arcStroke}
        strokeWidth={sw * 0.85}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M3.4 7.8 a5.4 5.4 0 0 0 0 6.8"
        stroke={arcStroke}
        strokeWidth={sw * 0.7}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />

      {/* Heart (twin lobes meeting at point) */}
      <Path
        d="M12 14.5 c-1.6-1.4-3.6-2.3-3.6-4.4 a2.2 2.2 0 0 1 3.6-1.7 a2.2 2.2 0 0 1 3.6 1.7 c0 2.1-2 3-3.6 4.4z"
        stroke={heartStroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Hand / palm cup */}
      <Path
        d="M4.5 16.4 c1.3-1.2 3.2-1.8 5-1.8 h5 c1.8 0 3.7 0.6 5 1.8 c-1.1 1.8-3.2 3-5.4 3.1 H10 c-2.2-0.1-4.3-1.3-5.5-3.1z"
        stroke={handStroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default EchoDonateGlyph;
