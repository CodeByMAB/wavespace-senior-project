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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '@/types/navigation';
import type { DisplayUnit } from '@/types/wallet';
import { useSettings } from '@context/SettingsContext';
import { useAuthContext } from '@context/AuthContext';
import { Button } from '@components/common/Button';
import { deleteMnemonic } from '@services/secureStorageService';
import { disconnectWallet } from '@services/walletService';
import { colors, spacing } from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

function displayUnitLabel(unit: DisplayUnit): string {
  if (unit === 'btc') return 'BTC';
  if (unit === 'both') return 'Both';
  return 'Sats';
}

function autoLockLabel(seconds: number): string {
  if (seconds === 0) return 'Never';
  if (seconds === 60) return '1 min';
  if (seconds === 300) return '5 min';
  if (seconds === 900) return '15 min';
  return `${seconds}s`;
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { state: settings, dispatch: settingsDispatch } = useSettings();
  const { logout } = useAuthContext();

  const runResetWallet = async () => {
    try {
      await deleteMnemonic();
      await disconnectWallet();
      await AsyncStorage.clear();
      logout();
    } catch {
      Alert.alert('Error', 'Could not reset wallet completely. Try again.');
    }
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

      <Text style={styles.sectionTitle}>NETWORK</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('NetworkSelection')}
          activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <Ionicons name="globe-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Network</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowValue}>
              {settings.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>DISPLAY</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('DisplayUnits')}
          activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <Ionicons name="calculator-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Display unit</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowValue}>{displayUnitLabel(settings.displayUnit)}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
        <View style={styles.rowSeparator} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="eye-off-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Hide balance</Text>
          </View>
          <Switch
            value={settings.hideBalance}
            onValueChange={() => settingsDispatch({ type: 'TOGGLE_HIDE_BALANCE' })}
            trackColor={{ false: colors.border, true: colors.primaryDark }}
            thumbColor={settings.hideBalance ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>SECURITY</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('ChangePIN')}
          activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Change PIN</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
        <View style={styles.rowSeparator} />
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('SecuritySettings')}
          activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Auto-lock</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowValue}>{autoLockLabel(settings.autoLockTimeout)}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>BACKUP</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('BackupExport')}
          activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <Ionicons name="document-text-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Backup / export</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('About')}
          activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

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
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => void runResetWallet(),
                },
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
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  dangerSection: {
    marginTop: spacing.xxxl,
  },
  resetBtn: {
    borderColor: colors.error,
    borderRadius: 50,
  },
});
