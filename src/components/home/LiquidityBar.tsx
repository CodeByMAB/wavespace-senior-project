import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useWallet} from '@context/WalletContext';
import {colors, spacing} from '@theme/index';
import {formatSats} from '@utils/formatters';

export function LiquidityBar() {
  const {state} = useWallet();
  const {inboundLiquiditySats, outboundLiquiditySats} = state.balance;
  const activeChannels = state.channels.filter(c => c.state === 'active').length;

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.value}>{formatSats(inboundLiquiditySats)}</Text>
        <Text style={styles.label}>Inbound</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={styles.value}>{formatSats(outboundLiquiditySats)}</Text>
        <Text style={styles.label}>Outbound</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.item}>
        <Text style={styles.value}>{activeChannels}</Text>
        <Text style={styles.label}>Channels</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.lg,
  },
  item: {
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },
  separator: {
    width: 1,
    backgroundColor: colors.border,
  },
});
