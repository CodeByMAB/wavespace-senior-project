import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, borderRadius, typography} from '@theme/index';

interface MnemonicGridProps {
  words: string[];
}

export function MnemonicGrid({words}: MnemonicGridProps) {
  return (
    <View style={styles.grid}>
      {words.map((word, index) => (
        <View key={index} style={styles.wordCell}>
          <Text style={styles.wordIndex}>{index + 1}</Text>
          <Text style={styles.wordText}>{word}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  wordCell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    width: '30%',
    gap: spacing.xs,
  },
  wordIndex: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontWeight: '600',
    minWidth: 20,
  },
  wordText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
