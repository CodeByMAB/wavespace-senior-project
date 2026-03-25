import React, {ReactNode} from 'react';
import {View, ViewStyle, StyleSheet} from 'react-native';
import {colors, spacing, borderRadius} from '@theme/index';

type CardVariant = 'default' | 'elevated' | 'outline';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  style,
}: CardProps) {
  return (
    <View style={[styles.base, variantMap[variant], {padding: spacing[padding]}, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
  },
});

const variantMap: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
};
