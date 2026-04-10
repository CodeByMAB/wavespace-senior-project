import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {Header} from '@components/common/Header';
import {CopyableText} from '@components/common/CopyableText';
import {colors, spacing} from '@theme/index';
import {
  formatAmount,
  formatSats,
  satsToFiat,
  truncateMiddle,
  formatTimestamp,
  formatTime,
} from '@utils/formatters';
import type {HomeStackParamList} from '@/types/navigation';
import type {Transaction} from '@/types/wallet';
import {useWallet} from '@context/WalletContext';
import {useSettings} from '@context/SettingsContext';

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
  const {state} = useWallet();
  const {state: settings} = useSettings();
  const {transaction: tx} = route.params;

  const isWithdrawal = tx.type === 'withdrawal' || tx.type === 'pending_withdrawal';
  const isSent =
    tx.type === 'sent' ||
    tx.type === 'pending_send' ||
    tx.type === 'withdrawal' ||
    tx.type === 'pending_withdrawal';
  const statusColor = getStatusColor(tx.status);
  const explorerBaseUrl = 'https://mempool.space/tx/';

  const shareTransaction = async () => {
    const amountLine = `${isSent ? '-' : '+'}${formatAmount(tx.amountSats, settings.displayUnit)}`;
    const feeLine =
      tx.feeSats > 0
        ? formatAmount(tx.feeSats, settings.displayUnit)
        : 'None';
    const lines = [
      `Type: ${isWithdrawal ? 'Withdrawal' : isSent ? 'Sent' : 'Received'}`,
      `Status: ${tx.status}`,
      `Amount: ${amountLine}`,
      `Fiat: ${satsToFiat(tx.amountSats)}`,
      `Date: ${formatTimestamp(tx.timestamp)} at ${formatTime(tx.timestamp)}`,
      `Fee: ${feeLine}`,
      tx.description ? `Description: ${tx.description}` : null,
      isWithdrawal && tx.destination ? `Destination: ${tx.destination}` : null,
      tx.txid ? `TxID: ${tx.txid}` : null,
      tx.bolt11 ? `Invoice: ${tx.bolt11}` : null,
    ].filter(Boolean);

    await Share.share({ message: lines.join('\n') });
  };

  const openExplorer = async () => {
    if (!tx.txid) return;
    await Linking.openURL(`${explorerBaseUrl}${tx.txid}`);
  };

  return (
    <View style={styles.container}>
      <Header title="" onBack={() => navigation.goBack()} rightAction={{icon: 'share-outline', onPress: shareTransaction}} />

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
            {settings.displayUnit === 'sats'
              ? formatSats(tx.amountSats)
              : formatAmount(tx.amountSats, settings.displayUnit)}
          </Text>
          {settings.displayUnit === 'sats' ? (
            <Text style={styles.amountUnit}>sats</Text>
          ) : null}
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
          <DetailRow label="Type" value={isWithdrawal ? 'Withdrawal' : isSent ? 'Sent' : 'Received'} />
          <DetailRow
            label="Date"
            value={`${formatTimestamp(tx.timestamp)} at ${formatTime(tx.timestamp)}`}
          />
          <DetailRow
            label="Fee"
            value={
              tx.feeSats > 0
                ? formatAmount(tx.feeSats, settings.displayUnit)
                : 'None'
            }
          />
          {tx.description && (
            <DetailRow label="Description" value={tx.description} />
          )}
          {!isWithdrawal && tx.destination && (
            <DetailRow
              label="Destination"
              value={truncateMiddle(tx.destination)}
            />
          )}
          {isWithdrawal && tx.destination && (
            <DetailRow
              label="Destination Address"
              value={truncateMiddle(tx.destination)}
            />
          )}
          {isWithdrawal && tx.txid && (
            <DetailRow label="Transaction ID" value={truncateMiddle(tx.txid)} />
          )}
          {isWithdrawal && (
            <DetailRow
              label="Confirmations"
              value={`${tx.confirmations ?? 0}/${tx.confirmationTarget ?? 6}`}
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

        {isWithdrawal && tx.destination && (
          <CopyableText
            label="DESTINATION ADDRESS"
            text={tx.destination}
            displayText={truncateMiddle(tx.destination, 12, 12)}
          />
        )}

        {isWithdrawal && tx.txid && (
          <CopyableText
            label="TRANSACTION ID"
            text={tx.txid}
            displayText={truncateMiddle(tx.txid, 12, 12)}
          />
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={shareTransaction}>
            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          {isWithdrawal && tx.txid ? (
            <TouchableOpacity style={styles.actionButton} onPress={openExplorer}>
              <Ionicons name="open-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.actionText}>View on Explorer</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
  actionsRow: {
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
