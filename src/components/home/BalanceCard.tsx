import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useWallet} from '@context/WalletContext';
import {useSettings} from '@context/SettingsContext';
import {colors, spacing, typography} from '@theme/index';
import {formatAmount, satsToFiat} from '@utils/formatters';

export function BalanceCard() {
  const {state} = useWallet();
  const {state: settings, dispatch: settingsDispatch} = useSettings();

  const toggleUnit = () => {
    settingsDispatch({
      type: 'SET_DISPLAY_UNIT',
      payload: settings.displayUnit === 'sats' ? 'btc' : 'sats',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.networkRow}>
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>
            {state.network === 'testnet' ? 'Testnet' : 'Mainnet'}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={toggleUnit} activeOpacity={0.7}>
        <Text style={styles.balance}>
          {settings.hideBalance
            ? '••••••'
            : formatAmount(
                state.balance.lightningBalanceSats,
                settings.displayUnit,
              )}
        </Text>
      </TouchableOpacity>

      <Text style={styles.fiat}>
        {settings.hideBalance
          ? '••••'
          : `${satsToFiat(state.balance.lightningBalanceSats)}`}
      </Text>
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
    backgroundColor: colors.primary,
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
});
