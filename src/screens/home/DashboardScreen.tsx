import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BalanceCard } from '@components/home/BalanceCard';
import { QuickActions } from '@components/home/QuickActions';
import { LiquidityBar } from '@components/home/LiquidityBar';
import { RecentTransactions } from '@components/home/RecentTransactions';
import { useWallet } from '@context/WalletContext';
import { useSettings } from '@context/SettingsContext';
import { colors, spacing } from '@theme/index';
import { formatAmount } from '@utils/formatters';
import type { HomeStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;

/** Balance at or above this (sats) triggers the large-balance reminder when enabled. */
const LARGE_BALANCE_WARNING_SATS = 10_000_000;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { state: settings } = useSettings();
  const { state, refreshNodeState, refreshTransactions, refreshChannels } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNodeState();
      await refreshChannels();
      await refreshTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  const balanceNum = state.balance.totalBalanceSats;
  const showLargeBalanceWarning =
    settings.securityAlertLargeBalance &&
    Number.isFinite(balanceNum) &&
    balanceNum >= LARGE_BALANCE_WARNING_SATS;

  const hasPendingOnChain = state.balance.onchainPendingSats > 0;
  const hasPendingTx = state.transactions.some((tx) => tx.status === 'pending');
  const showUnconfirmedWarning =
    settings.securityAlertUnconfirmedTx &&
    (hasPendingOnChain || hasPendingTx);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: insets.bottom + spacing.xxl,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}>
      <BalanceCard />

      {showLargeBalanceWarning ? (
        <View style={styles.alertBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.warning} />
          <Text style={styles.alertBannerText}>
            You hold a large balance (
            {formatAmount(Math.round(balanceNum), settings.displayUnit)}). Store your recovery phrase
            offline and review security settings.
          </Text>
        </View>
      ) : null}

      {showUnconfirmedWarning ? (
        <View style={[styles.alertBanner, styles.alertBannerInfo]}>
          <Ionicons name="hourglass-outline" size={18} color={colors.info} />
          <Text style={[styles.alertBannerText, styles.alertBannerTextInfo]}>
            You have unconfirmed or pending activity. Funds may not be final until confirmations
            complete.
          </Text>
        </View>
      ) : null}

      <QuickActions
        onSend={() => navigation.navigate('Send')}
        onReceive={() => navigation.navigate('Receive')}
        onWithdraw={() => navigation.navigate('Withdraw')}
        onScan={() => navigation.navigate('QRScanner', { returnScreen: 'Send' })}
      />

      <View style={styles.spacer} />

      <LiquidityBar />

      <RecentTransactions
        transactions={state.transactions}
        onSeeAll={() => {
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate('TransactionsTab');
          }
        }}
        onTransactionPress={tx =>
          navigation.navigate('TransactionDetail', { transaction: tx })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  spacer: {
    height: spacing.sm,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertBannerInfo: {
    backgroundColor: colors.surface,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  alertBannerTextInfo: {
    color: colors.textSecondary,
  },
});
