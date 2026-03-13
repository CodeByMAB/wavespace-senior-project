import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useWalletContext } from '../context/WalletContext';
import type { NodeState } from '../services/walletService';

function ConnectionDot({ isConnected, isSynced }: { isConnected: boolean; isSynced: boolean }) {
  const color = !isConnected ? '#FF3B30' : isSynced ? '#34C759' : '#FF9500';
  const label = !isConnected ? 'Disconnected' : isSynced ? 'Synced' : 'Syncing…';
  return (
    <View style={styles.statusRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.statusLabel, { color }]}>{label}</Text>
    </View>
  );
}

function truncatePubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}…${pubkey.slice(-8)}`;
}

function NodeInfoCard({ nodeState }: { nodeState: NodeState }) {
  const { identityPubkey, pendingReceiveSats, pendingSendSats, lastSyncedAt, network } = nodeState;

  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString()
    : 'Not yet synced';

  const networkLabel = network === 'testnet' ? 'Testnet' : 'Mainnet';

  return (
    <View style={styles.nodeCard}>
      <View style={styles.nodeRow}>
        <Text style={styles.nodeLabel}>Node</Text>
        <Text style={styles.nodeValue} numberOfLines={1}>
          {truncatePubkey(identityPubkey)}
        </Text>
      </View>
      <View style={styles.nodeRow}>
        <Text style={styles.nodeLabel}>Network</Text>
        <Text style={[styles.nodeValue, network === 'testnet' && styles.testnetBadge]}>
          {networkLabel}
        </Text>
      </View>
      {pendingReceiveSats > BigInt(0) && (
        <View style={styles.nodeRow}>
          <Text style={styles.nodeLabel}>Pending receive</Text>
          <Text style={[styles.nodeValue, styles.pendingIn]}>
            +{pendingReceiveSats.toLocaleString()} sats
          </Text>
        </View>
      )}
      {pendingSendSats > BigInt(0) && (
        <View style={styles.nodeRow}>
          <Text style={styles.nodeLabel}>Pending send</Text>
          <Text style={[styles.nodeValue, styles.pendingOut]}>
            -{pendingSendSats.toLocaleString()} sats
          </Text>
        </View>
      )}
      <View style={styles.nodeRow}>
        <Text style={styles.nodeLabel}>Last synced</Text>
        <Text style={styles.nodeValue}>{lastSyncLabel}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { balanceSats, isConnected, isSynced, isLoading, error, nodeState, refreshNodeState } =
    useWalletContext();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ConnectionDot isConnected={isConnected} isSynced={isSynced} />

        {/* error is already a user-friendly mapped message from the hook */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          {isLoading && balanceSats === null ? (
            <ActivityIndicator size="large" color="#F7931A" style={styles.skeleton} />
          ) : (
            <Text style={styles.balanceAmount}>
              {balanceSats !== null ? balanceSats.toLocaleString() : '—'}
              <Text style={styles.balanceUnit}> sats</Text>
            </Text>
          )}
        </View>

        {nodeState && <NodeInfoCard nodeState={nodeState} />}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refreshNodeState()}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>⟳ Refresh</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#3A0000',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#161616',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFF',
  },
  balanceUnit: {
    fontSize: 18,
    fontWeight: '400',
    color: '#888',
  },
  skeleton: {
    marginVertical: 12,
  },
  nodeCard: {
    backgroundColor: '#161616',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 10,
  },
  nodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nodeValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CCC',
    flexShrink: 1,
    marginLeft: 12,
    textAlign: 'right',
  },
  testnetBadge: {
    color: '#FF9500',
  },
  pendingIn: {
    color: '#34C759',
  },
  pendingOut: {
    color: '#FF9500',
  },
  refreshButton: {
    backgroundColor: '#F7931A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  refreshButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
