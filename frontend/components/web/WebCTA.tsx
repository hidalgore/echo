/**
 * ECHO WebCTA — reusable web button.
 * Variants: primary (gradient), solid, secondary (outline), ghost.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { brand } from '../../theme/brand';

interface Props {
  label: string;
  href?: Href;
  onPress?: () => void;
  variant?: 'primary' | 'solid' | 'secondary' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  size?: 'md' | 'lg';
}

export function WebCTA({ label, href, onPress, variant = 'primary', icon, iconRight, size = 'md' }: Props) {
  const handle = () => {
    if (onPress) return onPress();
    if (href) router.push(href as never);
  };

  const padH = size === 'lg' ? 24 : 18;
  const padV = size === 'lg' ? 14 : 11;
  const fontSize = size === 'lg' ? 16 : 14;

  if (variant === 'primary') {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={handle} style={styles.shadow}>
        <LinearGradient
          colors={[brand.cyan, brand.primary, brand.magenta, brand.orange]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { paddingHorizontal: padH, paddingVertical: padV }]}
        >
          {icon ? <Ionicons name={icon} size={fontSize + 2} color="#FFFFFF" /> : null}
          <Text style={[styles.label, { fontSize }]}>{label}</Text>
          {iconRight ? <Ionicons name={iconRight} size={fontSize + 2} color="#FFFFFF" /> : null}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'solid') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handle}
        style={[styles.button, styles.solid, { paddingHorizontal: padH, paddingVertical: padV }]}
      >
        {icon ? <Ionicons name={icon} size={fontSize + 2} color="#FFFFFF" /> : null}
        <Text style={[styles.label, { fontSize }]}>{label}</Text>
        {iconRight ? <Ionicons name={iconRight} size={fontSize + 2} color="#FFFFFF" /> : null}
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={handle}
        style={[styles.button, styles.secondary, { paddingHorizontal: padH, paddingVertical: padV }]}
      >
        {icon ? <Ionicons name={icon} size={fontSize + 2} color="#FFFFFF" /> : null}
        <Text style={[styles.label, styles.secondaryLabel, { fontSize }]}>{label}</Text>
        {iconRight ? <Ionicons name={iconRight} size={fontSize + 2} color="#FFFFFF" /> : null}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handle}
      style={[styles.button, styles.ghost, { paddingHorizontal: padH, paddingVertical: padV }]}
    >
      {icon ? <Ionicons name={icon} size={fontSize + 2} color="rgba(255,255,255,0.9)" /> : null}
      <Text style={[styles.label, styles.ghostLabel, { fontSize }]}>{label}</Text>
      {iconRight ? <Ionicons name={iconRight} size={fontSize + 2} color="rgba(255,255,255,0.9)" /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 999, alignSelf: 'flex-start' },
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
  },
  solid: { backgroundColor: brand.primary },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ghost: { backgroundColor: 'transparent' },
  label: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.1 },
  secondaryLabel: { color: '#FFFFFF' },
  ghostLabel: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});

export default WebCTA;
