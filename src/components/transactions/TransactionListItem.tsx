import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Transaction} from '@/types/wallet';
import {useSettings} from '@context/SettingsContext';
import {colors, spacing} from '@theme/index';
import {formatAmount, formatTimestamp} from '@utils/formatters';

interface TransactionListItemProps {
  transaction: Transaction;
  onPress: () => void;
}

function getTypeIcon(type: Transaction['type']) {
  switch (type) {
    case 'received':
    case 'pending_receive':
      return {name: 'arrow-down' as const, color: colors.received};
    case 'sent':
    case 'pending_send':
    case 'withdrawal':
    case 'pending_withdrawal':
      return {name: 'arrow-up' as const, color: colors.sent};
    default:
      return {name: 'time-outline' as const, color: colors.pending};
  }
}

export function TransactionListItem({
  transaction,
  onPress,
}: TransactionListItemProps) {
  const {state: settings} = useSettings();
  const icon = getTypeIcon(transaction.type);
  const isSent =
    transaction.type === 'sent' ||
    transaction.type === 'pending_send' ||
    transaction.type === 'withdrawal' ||
    transaction.type === 'pending_withdrawal';
  const confirmationText =
    transaction.type === 'withdrawal' || transaction.type === 'pending_withdrawal'
      ? `  ·  ${transaction.confirmations ?? 0}/${transaction.confirmationTarget ?? 6} conf`
      : '';
  const isPending = transaction.status === 'pending';
  const isFailed = transaction.status === 'failed';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.5}>
      <View style={[styles.iconCircle, {borderColor: icon.color}]}>
        <Ionicons name={icon.name} size={16} color={icon.color} />
      </View>

      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || (isSent ? 'Sent' : 'Received')}
        </Text>
        <Text style={styles.time}>
          {formatTimestamp(transaction.timestamp)}
          {isPending ? '  ·  Pending' : ''}
          {isFailed ? '  ·  Failed' : ''}
          {confirmationText}
        </Text>
      </View>

      <Text style={styles.amount}>
        {isSent ? '-' : '+'}
        {formatAmount(transaction.amountSats, settings.displayUnit)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});
