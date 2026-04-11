import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import type {SettingsStackParamList} from '@/types/navigation';
import type {DisplayUnit} from '@/types/wallet';
import {useSettings} from '@context/SettingsContext';
import {useAuthContext} from '@context/AuthContext';
import {useBiometricLoginToggle} from '@hooks/useBiometricLoginToggle';
import {Button} from '@components/common/Button';
import {CopyableText} from '@components/common/CopyableText';
import {StepProgressBar} from '@components/common/StepProgressBar';
import {useWallet} from '@context/WalletContext';
import {useMainnetTipHeight} from '@hooks/useMainnetTipHeight';
import {deleteMnemonic} from '@services/secureStorageService';
import {disconnectWallet} from '@services/walletService';
import {colors, spacing} from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const RESET_STEPS = [
  'Removing wallet secrets…',
  'Disconnecting Lightning…',
  'Clearing local data…',
  'Signing out…',
] as const;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {state: settings, dispatch: settingsDispatch} = useSettings();
  const {
    biometricsEnabled,
    onBiometricToggle,
    syncBiometricsFromWalletMetadata,
  } = useBiometricLoginToggle();
  const {state: walletState} = useWallet();
  const {height: tipHeight, loading: tipLoading} = useMainnetTipHeight();
  const {logout} = useAuthContext();
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetStepIndex, setResetStepIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void syncBiometricsFromWalletMetadata();
    }, [syncBiometricsFromWalletMetadata]),
  );

  const blockHeightLabel = tipLoading
    ? '…'
    : tipHeight != null
      ? tipHeight.toLocaleString('en-US')
      : '—';

  const runResetWallet = async () => {
    setResetModalVisible(true);
    setResetStepIndex(0);
    try {
      await deleteMnemonic();
      setResetStepIndex(1);
      await disconnectWallet();
      setResetStepIndex(2);
      await AsyncStorage.clear();
      setResetStepIndex(3);
      logout();
    } catch (err) {
      const detail =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : 'An unexpected error occurred.';
      Alert.alert(
        'Reset failed',
        `${detail}\n\nIf this keeps happening, try again or contact support.`,
      );
    } finally {
      setResetModalVisible(false);
      setResetStepIndex(0);
    }
  };

  return (
    <>
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
          <Text style={styles.rowValue}>Bitcoin mainnet</Text>
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
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="finger-print-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Biometric Login</Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={(v) => void onBiometricToggle(v)}
            trackColor={{false: colors.border, true: colors.primaryDark}}
            thumbColor={biometricsEnabled ? colors.primary : colors.textTertiary}
          />
        </View>
        <View style={styles.rowSeparator} />
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('SecuritySettings')}
          activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.rowLabel}>Auto-lock & Security</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Backup */}
      <Text style={styles.sectionTitle}>BACKUP</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('BackupExport')}
          activeOpacity={0.7}>
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
          <Text style={styles.rowValue}>{blockHeightLabel}</Text>
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

    <Modal
      visible={resetModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.resetModalBackdrop}>
        <View style={styles.resetModalCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <View style={styles.resetModalProgress}>
            <StepProgressBar
              currentStep={resetStepIndex}
              totalSteps={RESET_STEPS.length}
              label={RESET_STEPS[resetStepIndex] ?? RESET_STEPS[0]}
            />
          </View>
          <Text style={styles.resetModalHint}>Do not close the app.</Text>
        </View>
      </View>
    </Modal>
    </>
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
  resetModalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  resetModalCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: spacing.lg,
  },
  resetModalProgress: {
    alignSelf: 'stretch',
  },
  resetModalHint: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
