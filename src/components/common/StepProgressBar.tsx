import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme/index';

type Props = {
  /** 0-based index of the active step */
  currentStep: number;
  totalSteps: number;
  label: string;
};

export function StepProgressBar({ currentStep, totalSteps, label }: Props) {
  const clamped = Math.max(0, Math.min(currentStep, totalSteps - 1));
  const pct = totalSteps > 0 ? ((clamped + 1) / totalSteps) * 100 : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.track} accessibilityRole="progressbar">
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
