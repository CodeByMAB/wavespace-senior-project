import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {Header} from '@components/common/Header';
import {CopyableText} from '@components/common/CopyableText';
import {colors, spacing} from '@theme/index';
import {formatSats, satsToFiat, truncateMiddle, formatTimestamp, formatTime} from '@utils/formatters';
import type {HomeStackParamList} from '@/types/navigation';
import type {Transaction} from '@/types/wallet';

type Route = RouteProp<HomeStackParamList, 'TransactionDetail'>;

function getStatusColor(status: Transaction['status']) {
  switch (status) {
    case 'completed':
      return colors.received;
    case 'pending':
      return colors.pending;
    case 'failed':
      return colors.error;
    default:
      return colors.textTertiary;
  }
}

export function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const {transaction: tx} = route.params;

  const isSent = tx.type === 'sent' || tx.type === 'pending_send';
  const statusColor = getStatusColor(tx.status);

  return (
    <View style={styles.container}>
      <Header title="" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xxl},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Amount hero */}
        <View style={styles.amountSection}>
          <View style={[styles.typeIcon, {borderColor: isSent ? colors.sent : colors.received}]}>
            <Ionicons
              name={isSent ? 'arrow-up' : 'arrow-down'}
              size={24}
              color={isSent ? colors.sent : colors.received}
            />
          </View>

          <Text style={styles.amount}>
            {isSent ? '-' : '+'}
            {formatSats(tx.amountSats)}
          </Text>
          <Text style={styles.amountUnit}>sats</Text>
          <Text style={styles.fiat}>{satsToFiat(tx.amountSats)}</Text>

          <View style={[styles.statusPill, {borderColor: statusColor}]}>
            <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
            <Text style={[styles.statusText, {color: statusColor}]}>
              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Detail rows */}
        <View style={styles.detailsSection}>
          <DetailRow label="Type" value={isSent ? 'Sent' : 'Received'} />
          <DetailRow
            label="Date"
            value={`${formatTimestamp(tx.timestamp)} at ${formatTime(tx.timestamp)}`}
          />
          <DetailRow
            label="Fee"
            value={tx.feeSats > 0 ? `${formatSats(tx.feeSats)} sats` : 'None'}
          />
          {tx.description && (
            <DetailRow label="Description" value={tx.description} />
          )}
          {tx.destination && (
            <DetailRow
              label="Destination"
              value={truncateMiddle(tx.destination)}
            />
          )}
        </View>

        {/* Copyable hashes */}
        {tx.paymentHash && (
          <CopyableText
            label="PAYMENT HASH"
            text={tx.paymentHash}
            displayText={truncateMiddle(tx.paymentHash, 12, 12)}
          />
        )}

        {tx.preimage && (
          <CopyableText
            label="PREIMAGE"
            text={tx.preimage}
            displayText={truncateMiddle(tx.preimage, 12, 12)}
          />
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  amountSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: 42,
    fontWeight: '200',
    color: colors.textPrimary,
    letterSpacing: -1.5,
  },
  amountUnit: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: -4,
  },
  fiat: {
    fontSize: 15,
    color: colors.textTertiary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    marginTop: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.lg,
  },
});
