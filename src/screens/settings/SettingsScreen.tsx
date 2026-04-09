import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useSettings} from '@context/SettingsContext';
import {useWallet} from '@context/WalletContext';
import {useAuth} from '@context/AuthContext';
import {Button} from '@components/common/Button';
import {CopyableText} from '@components/common/CopyableText';
import {ASYNC_KEYS} from '@constants/storage';
import {colors, spacing} from '@theme/index';
import type {Network} from '@/types/wallet';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {state: settings, dispatch: settingsDispatch} = useSettings();
  const {state: walletState, reconnectAfterNetworkChange} = useWallet();
  const {dispatch: authDispatch} = useAuth();

  const handleNetworkChange = (network: Network) => {
    Alert.alert(
      'Switch Network',
      `Are you sure you want to switch to ${network}? This will require a wallet restart.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Switch',
          onPress: () => {
            void (async () => {
              await AsyncStorage.setItem(ASYNC_KEYS.NETWORK_SELECTION, network);
              settingsDispatch({type: 'SET_NETWORK', payload: network});
              await reconnectAfterNetworkChange();
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.xxl,
      }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Settings</Text>

      {/* Network */}
      <Text style={styles.sectionTitle}>NETWORK</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="globe-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Network</Text>
          </View>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segment,
                settings.network === 'testnet' && styles.segmentActive,
              ]}
              onPress={() => handleNetworkChange('testnet')}>
              <Text
                style={[
                  styles.segmentText,
                  settings.network === 'testnet' && styles.segmentTextActive,
                ]}>
                Testnet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                settings.network === 'mainnet' && styles.segmentActive,
              ]}
              onPress={() => handleNetworkChange('mainnet')}>
              <Text
                style={[
                  styles.segmentText,
                  settings.network === 'mainnet' && styles.segmentTextActive,
                ]}>
                Mainnet
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Display */}
      <Text style={styles.sectionTitle}>DISPLAY</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="calculator-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Display Unit</Text>
          </View>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segment,
                settings.displayUnit === 'sats' && styles.segmentActive,
              ]}
              onPress={() =>
                settingsDispatch({type: 'SET_DISPLAY_UNIT', payload: 'sats'})
              }>
              <Text
                style={[
                  styles.segmentText,
                  settings.displayUnit === 'sats' && styles.segmentTextActive,
                ]}>
                Sats
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                settings.displayUnit === 'btc' && styles.segmentActive,
              ]}
              onPress={() =>
                settingsDispatch({type: 'SET_DISPLAY_UNIT', payload: 'btc'})
              }>
              <Text
                style={[
                  styles.segmentText,
                  settings.displayUnit === 'btc' && styles.segmentTextActive,
                ]}>
                BTC
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rowSeparator} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="eye-off-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Hide Balance</Text>
          </View>
          <Switch
            value={settings.hideBalance}
            onValueChange={() =>
              settingsDispatch({type: 'TOGGLE_HIDE_BALANCE'})
            }
            trackColor={{false: colors.border, true: colors.primaryDark}}
            thumbColor={settings.hideBalance ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>

      {/* Security */}
      <Text style={styles.sectionTitle}>SECURITY</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Change PIN</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.rowSeparator} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="finger-print-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Biometric Login</Text>
          </View>
          <Switch
            value={settings.biometricsEnabled}
            onValueChange={() =>
              settingsDispatch({type: 'TOGGLE_BIOMETRICS'})
            }
            trackColor={{false: colors.border, true: colors.primaryDark}}
            thumbColor={settings.biometricsEnabled ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>

      {/* Backup */}
      <Text style={styles.sectionTitle}>BACKUP</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="document-text-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>View Recovery Phrase</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Version</Text>
          </View>
          <Text style={styles.rowValue}>0.1.0</Text>
        </View>
        <View style={styles.rowSeparator} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="cube-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Block Height</Text>
          </View>
          <Text style={styles.rowValue}>{walletState.blockHeight}</Text>
        </View>
      </View>

      <CopyableText label="NODE ID" text={walletState.nodeId} />

      <View style={styles.dangerSection}>
        <Button
          title="Reset Wallet"
          variant="outline"
          icon="trash-outline"
          style={styles.resetBtn}
          onPress={() =>
            Alert.alert(
              'Reset Wallet',
              'This will erase all wallet data. Make sure you have backed up your recovery phrase.',
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Reset', style: 'destructive', onPress: () => {}},
              ],
            )
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
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
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  rowSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.primaryMuted,
  },
  segmentText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  dangerSection: {
    marginTop: spacing.xxxl,
  },
  resetBtn: {
    borderColor: colors.error,
    borderRadius: 50,
  },
});
