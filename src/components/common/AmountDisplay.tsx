import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, typography} from '@theme/index';
import type {DisplayUnit, TransactionType} from '@/types/wallet';
import {formatAmount, satsToFiat} from '@utils/formatters';

interface AmountDisplayProps {
  amountSats: number;
  displayUnit: DisplayUnit;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFiat?: boolean;
  showSign?: boolean;
  type?: TransactionType;
  onToggleUnit?: () => void;
}

const sizeMap = {
  sm: typography.bodyMedium,
  md: typography.h3,
  lg: typography.displayMedium,
  xl: typography.displayLarge,
};

function getAmountColor(type?: TransactionType): string {
  if (!type) return colors.textPrimary;
  if (type === 'received' || type === 'pending_receive') return colors.received;
  return colors.textPrimary;
}

export function AmountDisplay({
  amountSats,
  displayUnit,
  size = 'md',
  showFiat = false,
  showSign = false,
  type,
  onToggleUnit,
}: AmountDisplayProps) {
  const sign =
    showSign && type
      ? type === 'received' || type === 'pending_receive'
        ? '+'
        : '-'
      : '';
  const amountColor = getAmountColor(type);

  const content = (
    <View style={styles.container}>
      <Text style={[sizeMap[size], {color: amountColor}]}>
        {sign}
        {formatAmount(amountSats, displayUnit)}
      </Text>
      {showFiat && (
        <Text style={styles.fiat}>
          {'\u2248'} {satsToFiat(amountSats)}
        </Text>
      )}
    </View>
  );

  if (onToggleUnit) {
    return (
      <TouchableOpacity onPress={onToggleUnit} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  fiat: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
