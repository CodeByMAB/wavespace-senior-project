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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '@/types/navigation';
import { Header } from '@components/common/Header';
import { useSettings } from '@context/SettingsContext';
import { useAuthContext } from '@context/AuthContext';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
} from '@services/authService';
import { getWalletMetadata, storeWalletMetadata } from '@services/secureStorageService';
import { colors, spacing } from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const AUTO_OPTIONS: { seconds: number; label: string }[] = [
  { seconds: 60, label: '1 minute' },
  { seconds: 300, label: '5 minutes' },
  { seconds: 900, label: '15 minutes' },
  { seconds: 0, label: 'Never' },
];

export function SecuritySettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { state: settings, dispatch: settingsDispatch } = useSettings();
  const { syncPersistedAuthState } = useAuthContext();

  const onBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const available = await isBiometricAvailable();
      if (!available) {
        Alert.alert(
          'Unavailable',
          'Biometric authentication is not available on this device.',
        );
        return;
      }
      const ok = await authenticateWithBiometric();
      if (!ok) {
        Alert.alert('Authentication failed', 'Biometric verification was cancelled or failed.');
        return;
      }
      try {
        const existing = await getWalletMetadata();
        const metadata = existing ? JSON.parse(existing) : {};
        metadata.biometricEnabled = true;
        await storeWalletMetadata(JSON.stringify(metadata));
        if (!settings.biometricsEnabled) {
          settingsDispatch({ type: 'TOGGLE_BIOMETRICS' });
        }
        await syncPersistedAuthState();
      } catch {
        Alert.alert('Error', 'Could not enable biometrics.');
      }
      return;
    }

    try {
      const existing = await getWalletMetadata();
      const metadata = existing ? JSON.parse(existing) : {};
      metadata.biometricEnabled = false;
      await storeWalletMetadata(JSON.stringify(metadata));
      if (settings.biometricsEnabled) {
        settingsDispatch({ type: 'TOGGLE_BIOMETRICS' });
      }
      await syncPersistedAuthState();
    } catch {
      Alert.alert('Error', 'Could not update biometric preference.');
    }
  };

  return (
    <View style={styles.root}>
      <Header title="Security" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>ACCESS</Text>
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
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="finger-print-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Biometric login</Text>
            </View>
            <Switch
              value={settings.biometricsEnabled}
              onValueChange={(v) => void onBiometricToggle(v)}
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={
                settings.biometricsEnabled ? colors.primary : colors.textTertiary
              }
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>SECURITY ALERTS</Text>
        <Text style={styles.sectionHint}>
          Optional warnings on the home screen when your balance is large or funds are still confirming.
        </Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="wallet-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Large balance reminder</Text>
            </View>
            <Switch
              value={settings.securityAlertLargeBalance}
              onValueChange={(v) =>
                settingsDispatch({ type: 'SET_SECURITY_ALERT_LARGE_BALANCE', payload: v })
              }
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={
                settings.securityAlertLargeBalance ? colors.primary : colors.textTertiary
              }
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Unconfirmed activity</Text>
            </View>
            <Switch
              value={settings.securityAlertUnconfirmedTx}
              onValueChange={(v) =>
                settingsDispatch({
                  type: 'SET_SECURITY_ALERT_UNCONFIRMED_TX',
                  payload: v,
                })
              }
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={
                settings.securityAlertUnconfirmedTx ? colors.primary : colors.textTertiary
              }
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>AUTO-LOCK</Text>
        <View style={styles.section}>
          {AUTO_OPTIONS.map(({ seconds, label }, index) => (
            <React.Fragment key={seconds}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  settingsDispatch({ type: 'SET_AUTO_LOCK_TIMEOUT', payload: seconds })
                }
                activeOpacity={0.7}>
                <Text style={styles.rowLabel}>{label}</Text>
                {settings.autoLockTimeout === seconds ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            </React.Fragment>
          ))}
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
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
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});
