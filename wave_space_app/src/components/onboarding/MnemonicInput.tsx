import React from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';
import {colors, spacing, borderRadius, typography} from '@theme/index';

interface MnemonicInputProps {
  words: string[];
  onWordChange: (index: number, word: string) => void;
}

export function MnemonicInput({words, onWordChange}: MnemonicInputProps) {
  return (
    <View style={styles.grid}>
      {words.map((word, index) => (
        <View key={index} style={styles.inputCell}>
          <Text style={styles.inputIndex}>{index + 1}</Text>
          <TextInput
            style={styles.textInput}
            value={word}
            onChangeText={text => onWordChange(index, text.toLowerCase().trim())}
            placeholder="..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={index < words.length - 1 ? 'next' : 'done'}
          />
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
  inputCell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    width: '30%',
    gap: spacing.xs,
  },
  inputIndex: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontWeight: '600',
    minWidth: 18,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
});
