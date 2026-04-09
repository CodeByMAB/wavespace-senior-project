import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '@/types/navigation';
import type { Network } from '@/types/wallet';
import { Header } from '@components/common/Header';
import { useSettings } from '@context/SettingsContext';
import { useWallet } from '@context/WalletContext';
import { colors, spacing } from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

export function NetworkSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { state: settings, setNetworkWithPersistence } = useSettings();
  const { reconnectAfterNetworkChange } = useWallet();

  const selectNetwork = (network: Network) => {
    if (network === settings.network) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Switch Network',
      `Switch to ${network}? This will restart the wallet. Testnet and mainnet data are stored separately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            void (async () => {
              try {
                await setNetworkWithPersistence(network);
                await reconnectAfterNetworkChange();
                navigation.goBack();
              } catch {
                Alert.alert(
                  'Network',
                  'Could not save network or reconnect. Please try again.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <Header title="Network" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={22} color={colors.warning} />
          <Text style={styles.warningText}>
            Switching networks restarts the wallet. Testnet and mainnet balances
            and history are separate.
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => selectNetwork('testnet')}
            activeOpacity={0.7}>
            <Text style={styles.rowLabel}>Testnet</Text>
            {settings.network === 'testnet' ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            ) : null}
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => selectNetwork('mainnet')}
            activeOpacity={0.7}>
            <Text style={styles.rowLabel}>Mainnet</Text>
            {settings.network === 'mainnet' ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            ) : null}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});
