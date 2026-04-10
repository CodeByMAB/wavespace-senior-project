import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useWallet} from '@context/WalletContext';
import {useSettings} from '@context/SettingsContext';
import {colors, spacing, typography} from '@theme/index';
import type {DisplayUnit} from '@/types/wallet';
import {formatAmount, satsToFiat} from '@utils/formatters';
import {getBtcPriceUsd} from '@services/priceService';

export function BalanceCard() {
  const {state, isLoading, sdkError} = useWallet();
  const {isInitialized, isSyncing} = state;
  const {state: settings, dispatch: settingsDispatch} = useSettings();

  const toggleUnit = () => {
    const cycle: DisplayUnit[] = ['sats', 'btc'];
    const i = cycle.indexOf(settings.displayUnit);
    const next = cycle[(i + 1) % cycle.length]!;
    settingsDispatch({
      type: 'SET_DISPLAY_UNIT',
      payload: next,
    });
  };

  const totalSats = state.balance.totalBalanceSats;

  const networkDotColor =
    sdkError || !isInitialized
      ? colors.error
      : isSyncing
        ? colors.warning
        : colors.success;

  useEffect(() => {
    getBtcPriceUsd().catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.networkRow}>
        <View style={styles.networkBadge}>
          <View style={[styles.networkDot, {backgroundColor: networkDotColor}]} />
          <Text style={styles.networkText}>
            Mainnet
          </Text>
        </View>
      </View>

      {sdkError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={18} color={colors.error} />
          <Text style={styles.errorBannerText}>{sdkError}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingHint}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingLabel}>Connecting…</Text>
        </View>
      ) : isSyncing ? (
        <View style={styles.loadingHint}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingLabel}>Syncing…</Text>
        </View>
      ) : null}

      <View style={styles.balanceBlock}>
        <TouchableOpacity onPress={toggleUnit} activeOpacity={0.7}>
          <Text style={styles.balance}>
            {settings.hideBalance
              ? '••••••'
              : formatAmount(totalSats, settings.displayUnit)}
          </Text>
        </TouchableOpacity>

        <Text style={styles.fiat}>
          {settings.hideBalance ? '••••' : `${satsToFiat(totalSats)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  networkRow: {
    marginBottom: spacing.xl,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  balance: {
    fontSize: 52,
    fontWeight: '200',
    color: colors.textPrimary,
    letterSpacing: -2,
  },
  fiat: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  balanceBlock: {
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  loadingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingLabel: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  errorBannerText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
