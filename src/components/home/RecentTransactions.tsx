import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {TransactionListItem} from '@components/transactions/TransactionListItem';
import {EmptyState} from '@components/common/EmptyState';
import type {Transaction} from '@/types/wallet';
import {colors, spacing} from '@theme/index';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeAll: () => void;
  onTransactionPress: (tx: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  onSeeAll,
  onTransactionPress,
}: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5);
  const isEmpty = transactions.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent</Text>
        {!isEmpty ? (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isEmpty ? (
        <EmptyState
          icon="swap-horizontal-outline"
          title="No transactions yet"
          subtitle="Payments you send or receive will show up here."
        />
      ) : (
        recent.map((tx, i) => (
          <React.Fragment key={tx.id}>
            {i > 0 && <View style={styles.separator} />}
            <TransactionListItem
              transaction={tx}
              onPress={() => onTransactionPress(tx)}
            />
          </React.Fragment>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  headerSpacer: {
    width: 48,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
});
