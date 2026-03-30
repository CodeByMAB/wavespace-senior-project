import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, borderRadius} from '@theme/index';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  label,
  onPress,
  size = 24,
  color = colors.primary,
  backgroundColor = colors.surface,
  style,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor}, style]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Ionicons name={icon} size={size} color={color} />
      {label && <Text style={[styles.label, {color}]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
