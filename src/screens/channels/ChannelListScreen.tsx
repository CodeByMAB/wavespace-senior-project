import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Header} from '@components/common/Header';
import {Card} from '@components/common/Card';
import {Badge} from '@components/common/Badge';
import {ProgressBar} from '@components/common/ProgressBar';
import {EmptyState} from '@components/common/EmptyState';
import {useWallet} from '@context/WalletContext';
import {colors, spacing, typography, borderRadius} from '@theme/index';
import {formatSats, truncateMiddle} from '@utils/formatters';
import type {Channel, ChannelState} from '@/types/wallet';

type Filter = 'all' | ChannelState;

const FILTERS: {key: Filter; label: string}[] = [
  {key: 'all', label: 'All'},
  {key: 'active', label: 'Active'},
  {key: 'inactive', label: 'Inactive'},
  {key: 'pending_open', label: 'Pending'},
];

function getChannelBadge(state: ChannelState) {
  switch (state) {
    case 'active':
      return {label: 'Active', variant: 'success' as const};
    case 'inactive':
      return {label: 'Inactive', variant: 'default' as const};
    case 'pending_open':
      return {label: 'Opening', variant: 'warning' as const};
    case 'pending_close':
      return {label: 'Closing', variant: 'error' as const};
  }
}

export function ChannelListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {state} = useWallet();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return state.channels;
    return state.channels.filter(c => c.state === filter);
  }, [state.channels, filter]);

  const totalCapacity = state.channels.reduce(
    (sum, c) => sum + c.capacitySats,
    0,
  );
  const activeCount = state.channels.filter(c => c.state === 'active').length;

  const renderChannel = ({item}: {item: Channel}) => {
    const badge = getChannelBadge(item.state);
    const localPercent =
      item.capacitySats > 0
        ? item.localBalanceSats / item.capacitySats
        : 0;

    return (
      <Card style={styles.channelCard}>
        <View style={styles.channelHeader}>
          <Text style={styles.channelAlias}>
            {item.remoteAlias || truncateMiddle(item.remotePubkey, 8, 6)}
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
              Local: {formatSats(item.localBalanceSats)}
            </Text>
            <Text style={styles.capacityRemote}>
              Remote: {formatSats(item.remoteBalanceSats)}
            </Text>
          </View>
        </View>

        <View style={styles.channelFooter}>
          <Text style={styles.capacityTotal}>
            Capacity: {formatSats(item.capacitySats)} sats
          </Text>
          {item.shortChannelId && (
            <Text style={styles.channelId}>{item.shortChannelId}</Text>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Lightning Channels" onBack={() => navigation.goBack()} />

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Capacity</Text>
            <Text style={styles.summaryValue}>
              {formatSats(totalCapacity)} sats
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active</Text>
            <Text style={styles.summaryValue}>
              {activeCount}/{state.channels.length}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f.key)}>
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderChannel}
        contentContainerStyle={[
          styles.list,
          {paddingBottom: insets.bottom + 20},
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="git-branch-outline"
            title="No channels"
            subtitle="Channels will appear here when opened"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  summaryValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  channelCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  channelAlias: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  capacitySection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  channelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityTotal: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  channelId: {
    ...typography.mono,
    color: colors.textTertiary,
    fontSize: 11,
  },
});
