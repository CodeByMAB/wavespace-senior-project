import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.textTertiary} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
