import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useWallet} from '@context/WalletContext';
import {colors, spacing} from '@theme/index';
import {formatSats} from '@utils/formatters';

export function LiquidityBar() {
  const {state} = useWallet();
  const {inboundLiquiditySats, outboundLiquiditySats} = state.balance;
  const activeChannels = state.channels.filter(c => c.state === 'active').length;
  const totalLiquidity = inboundLiquiditySats + outboundLiquiditySats;
  const inboundPct =
    totalLiquidity > 0 ? inboundLiquiditySats / totalLiquidity : 0.5;
  const outboundPct =
    totalLiquidity > 0 ? outboundLiquiditySats / totalLiquidity : 0.5;

  return (
    <View style={styles.wrapper}>
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
      <View style={styles.barTrack}>
        {totalLiquidity === 0 ? (
          <View style={styles.barEmpty} />
        ) : (
          <>
            <View
              style={[styles.barInbound, {flex: Math.max(inboundPct, 0.02)}]}
            />
            <View
              style={[styles.barOutbound, {flex: Math.max(outboundPct, 0.02)}]}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.lg,
  },
  barTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  barEmpty: {
    flex: 1,
    backgroundColor: colors.textTertiary,
    opacity: 0.35,
  },
  barInbound: {
    backgroundColor: colors.channelRemote,
    minWidth: 2,
  },
  barOutbound: {
    backgroundColor: colors.channelLocal,
    minWidth: 2,
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
