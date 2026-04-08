import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {TransactionListItem} from '@components/transactions/TransactionListItem';
import {EmptyState} from '@components/common/EmptyState';
import {useWallet} from '@context/WalletContext';
import {colors, spacing} from '@theme/index';
import {getDateGroup} from '@utils/formatters';
import type {Transaction} from '@/types/wallet';
import type {TransactionsStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<
  TransactionsStackParamList,
  'TransactionHistory'
>;

type Filter = 'all' | 'sent' | 'received' | 'pending' | 'failed';

const FILTERS: {key: Filter; label: string}[] = [
  {key: 'all', label: 'All'},
  {key: 'sent', label: 'Sent'},
  {key: 'received', label: 'Received'},
  {key: 'pending', label: 'Pending'},
  {key: 'failed', label: 'Failed'},
];

export function TransactionHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {state} = useWallet();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filteredSections = useMemo(() => {
    let txs = state.transactions;

    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter(
        tx =>
          tx.description?.toLowerCase().includes(q) ||
          tx.destination?.toLowerCase().includes(q),
      );
    }

    if (filter !== 'all') {
      txs = txs.filter(tx => {
        if (filter === 'sent') return tx.type === 'sent' || tx.type === 'pending_send';
        if (filter === 'received') return tx.type === 'received' || tx.type === 'pending_receive';
        if (filter === 'pending') return tx.status === 'pending';
        if (filter === 'failed') return tx.status === 'failed';
        return true;
      });
    }

    const groups: Record<string, Transaction[]> = {};
    txs.forEach(tx => {
      const group = getDateGroup(tx.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push(tx);
    });

    return Object.entries(groups).map(([title, data]) => ({title, data}));
  }, [state.transactions, search, filter]);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
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

      <SectionList
        sections={filteredSections}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.itemPadding}>
            <TransactionListItem
              transaction={item}
              onPress={() =>
                navigation.navigate('TransactionDetail', {transaction: item})
              }
            />
          </View>
        )}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No transactions"
            subtitle="Your transaction history will appear here"
          />
        }
        contentContainerStyle={{paddingBottom: insets.bottom + 20}}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  filterText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.primary,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  itemPadding: {
    paddingHorizontal: spacing.xl,
  },
});
