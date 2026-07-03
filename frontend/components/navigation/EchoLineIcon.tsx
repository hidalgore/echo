import React from 'react';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

export type EchoLineIconName = 'home' | 'search' | 'wallet' | 'profile' | 'notifications';
export type EchoLineIconState = 'active' | 'default' | 'inactive';

interface EchoLineIconProps {
  name: EchoLineIconName;
  state?: EchoLineIconState;
  size?: number;
  notificationWaiting?: boolean;
}

const STROKES = {
  active: 'url(#echoIconGradient)',
  default: 'rgba(245,247,251,0.76)',
  inactive: 'rgba(123,129,150,0.34)',
};

const GLOW_STROKES = {
  active: 'rgba(123,77,255,0.34)',
  default: 'transparent',
  inactive: 'transparent',
};

export function EchoLineIcon({ name, state = 'default', size = 28, notificationWaiting = false }: EchoLineIconProps) {
  const stroke = STROKES[state];
  const glowStroke = GLOW_STROKES[state];
  const isNotification = name === 'notifications';
  const strokeWidth = state === 'active' ? (isNotification ? 2.05 : 2.35) : (isNotification ? 1.95 : 2.15);
  const glowWidth = isNotification ? 4.1 : 5.5;

  const renderGlyph = (glyphStroke: string, width: number, opacity = 1) => {
    const common = {
      stroke: glyphStroke,
      strokeWidth: width,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      fill: 'none' as const,
      opacity,
    };

    switch (name) {
      case 'home':
        return (
          <>
            <Path d="M5.8 14.2L18 4.2l12.2 10v14.1a2.5 2.5 0 0 1-2.5 2.5h-5.6v-7.7a2.1 2.1 0 0 0-2.1-2.1h-4a2.1 2.1 0 0 0-2.1 2.1v7.7H8.3a2.5 2.5 0 0 1-2.5-2.5V14.2Z" {...common} />
          </>
        );
      case 'search':
        return (
          <>
            <Circle cx="16.3" cy="16.1" r="10.1" {...common} />
            <Path d="M24 24.2l6.2 6.1" {...common} />
          </>
        );
      case 'wallet':
        return (
          <>
            <Path d="M7.2 10.7h20.2a3.2 3.2 0 0 1 3.2 3.2v12.5a3.2 3.2 0 0 1-3.2 3.2H8.8a3.4 3.4 0 0 1-3.4-3.4V9.7a3.3 3.3 0 0 1 3.3-3.3h17.1a2.4 2.4 0 0 1 2.4 2.4v1.9" {...common} />
            <Path d="M5.6 13.3h19.8" {...common} />
            <Circle cx="24.4" cy="20" r="1.8" {...common} />
          </>
        );
      case 'profile':
        return (
          <>
            <Circle cx="18" cy="18" r="13.2" {...common} />
            <Circle cx="18" cy="13.9" r="4" {...common} />
            <Path d="M9.9 27.4c1.4-4.2 4.2-6.3 8.1-6.3s6.7 2.1 8.1 6.3" {...common} />
          </>
        );
      case 'notifications':
        return (
          <>
            <Path d="M10.1 24.6h15.8c1.6 0 2.4-1.9 1.2-3l-1.4-1.3v-5.5c0-4.2-2.7-7.6-6.4-8.5-.3-1.1-1.2-1.9-2.3-1.9s-2 .8-2.3 1.9c-3.7.9-6.4 4.3-6.4 8.5v5.5l-1.4 1.3c-1.2 1.1-.4 3 1.2 3Z" {...common} />
            <Path d="M14.2 27.1c.6 2 2 3.1 3.8 3.1s3.2-1.1 3.8-3.1" {...common} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Defs>
        <SvgGradient id="echoIconGradient" x1="4" y1="30" x2="32" y2="6" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#20C7FF" />
          <Stop offset="0.42" stopColor="#7B4DFF" />
          <Stop offset="0.72" stopColor="#E63DAD" />
          <Stop offset="1" stopColor="#FFB45C" />
        </SvgGradient>
        <SvgGradient id="echoDotGradient" x1="0" y1="12" x2="12" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E63DAD" />
          <Stop offset="1" stopColor="#FFB45C" />
        </SvgGradient>
      </Defs>
      {state === 'active' ? renderGlyph(glowStroke, glowWidth, isNotification ? 0.38 : 0.68) : null}
      {renderGlyph(stroke, strokeWidth)}
      {name === 'notifications' && notificationWaiting ? (
        <>
          <Circle cx="27.8" cy="8.2" r="4.2" fill="url(#echoDotGradient)" opacity={state === 'inactive' ? 0.45 : 1} />
          {state === 'active' ? <Circle cx="27.8" cy="8.2" r="5.35" fill="none" stroke="#FFB45C" strokeWidth="0.8" opacity="0.16" /> : null}
        </>
      ) : null}
    </Svg>
  );
}

export default EchoLineIcon;
