import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, borderRadius} from '@theme/index';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, {bg: string; text: string}> = {
  success: {bg: colors.successMuted, text: colors.success},
  warning: {bg: colors.warningMuted, text: colors.warning},
  error: {bg: colors.errorMuted, text: colors.error},
  info: {bg: colors.infoMuted, text: colors.info},
  default: {bg: colors.surfaceElevated, text: colors.textSecondary},
};

export function Badge({label, variant = 'default'}: BadgeProps) {
  const c = variantColors[variant];
  return (
    <View style={[styles.container, {backgroundColor: c.bg}]}>
      <Text style={[styles.text, {color: c.text}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
