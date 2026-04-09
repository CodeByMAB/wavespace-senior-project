import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {Header} from '@components/common/Header';
import {Badge} from '@components/common/Badge';
import {ProgressBar} from '@components/common/ProgressBar';
import {CopyableText} from '@components/common/CopyableText';
import {colors, spacing, typography} from '@theme/index';
import {formatSats, truncateMiddle} from '@utils/formatters';
import type {HomeStackParamList} from '@/types/navigation';
import type {ChannelState} from '@/types/wallet';

type Route = RouteProp<HomeStackParamList, 'ChannelDetail'>;

function channelStateBadge(state: ChannelState) {
  switch (state) {
    case 'active':
      return {label: 'Active', variant: 'success' as const};
    case 'inactive':
      return {label: 'Inactive', variant: 'default' as const};
    case 'pending_open':
      return {label: 'Opening', variant: 'warning' as const};
    case 'pending_close':
      return {label: 'Closing', variant: 'error' as const};
    case 'closed':
      return {label: 'Closed', variant: 'default' as const};
  }
}

function stateLabel(state: ChannelState): string {
  switch (state) {
    case 'pending_open':
      return 'Pending open';
    case 'pending_close':
      return 'Pending close';
    case 'closed':
      return 'Closed';
    default:
      return state.charAt(0).toUpperCase() + state.slice(1);
  }
}

function formatChannelAge(openedAtMs?: number): string {
  if (openedAtMs == null || !Number.isFinite(openedAtMs)) {
    return '—';
  }
  const sec = Math.max(0, Math.floor((Date.now() - openedAtMs) / 1000));
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

export function ChannelDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const {channel: ch} = route.params;

  const title = ch.remoteAlias || truncateMiddle(ch.remotePubkey, 10, 8);
  const badge = channelStateBadge(ch.state);
  const localPercent =
    ch.capacitySats > 0 ? ch.localBalanceSats / ch.capacitySats : 0;

  return (
    <View style={styles.container}>
      <Header title="" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xxl},
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Badge label={badge.label} variant={badge.variant} />
        </View>

        <View style={styles.capacitySection}>
          <View style={styles.barContainer}>
            <ProgressBar
              progress={localPercent}
              color={colors.channelLocal}
              backgroundColor={colors.channelRemote}
              height={8}
            />
          </View>
          <View style={styles.capacityLabels}>
            <Text style={styles.capacityLocal}>
              Local: {formatSats(ch.localBalanceSats)} sats
            </Text>
            <Text style={styles.capacityRemote}>
              Remote: {formatSats(ch.remoteBalanceSats)} sats
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <DetailRow
            label="Channel ID"
            value={ch.shortChannelId ?? '—'}
          />
          <DetailRow
            label="Channel point"
            value={ch.channelPoint ?? '—'}
          />
          <DetailRow
            label="Funding tx"
            value={ch.fundingTxid ?? (ch.channelPoint ? ch.channelPoint.split(':')[0] : '—')}
          />
          <DetailRow label="Age" value={formatChannelAge(ch.openedAtMs)} />
          <DetailRow
            label="Capacity"
            value={`${formatSats(ch.capacitySats)} sats`}
          />
          <DetailRow
            label="Local balance"
            value={`${formatSats(ch.localBalanceSats)} sats`}
          />
          <DetailRow
            label="Remote balance"
            value={`${formatSats(ch.remoteBalanceSats)} sats`}
          />
          <DetailRow
            label="Total received"
            value={
              ch.totalReceivedSats != null
                ? `${formatSats(ch.totalReceivedSats)} sats`
                : '—'
            }
          />
          <DetailRow
            label="Total sent"
            value={
              ch.totalSentSats != null
                ? `${formatSats(ch.totalSentSats)} sats`
                : '—'
            }
          />
          <DetailRow label="State" value={stateLabel(ch.state)} />
          <DetailRow label="Usable" value={ch.isUsable ? 'Yes' : 'No'} />
        </View>

        <CopyableText
          label="REMOTE PUBKEY"
          text={ch.remotePubkey}
          displayText={truncateMiddle(ch.remotePubkey, 12, 12)}
        />
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
  headerSection: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  capacitySection: {
    gap: spacing.sm,
  },
  barContainer: {},
  capacityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityLocal: {
    ...typography.bodySmall,
    color: colors.channelLocal,
    fontWeight: '500',
  },
  capacityRemote: {
    ...typography.bodySmall,
    color: colors.channelRemote,
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
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  detailValue: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.lg,
  },
});
