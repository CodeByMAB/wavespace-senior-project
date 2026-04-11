import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {GradientBackground} from '@components/common/GradientBackground';
import {Button} from '@components/common/Button';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';
import {OnboardingStackParamList} from '@navigation/OnboardingStack';
import {useMarkOnboardingComplete} from '@context/OnboardingGateContext';
import {useSettings} from '@context/SettingsContext';
import {useAuthContext} from '@context/AuthContext';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
} from '@services/authService';
import {storeWalletMetadata, getWalletMetadata} from '@services/secureStorageService';
import {ASYNC_KEYS} from '@constants/storage';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'BiometricSetup'>;

export default function BiometricSetupScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const markOnboardingComplete = useMarkOnboardingComplete();
  const {dispatch: settingsDispatch} = useSettings();
  const {syncPersistedAuthState} = useAuthContext();
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const completeOnboarding = async (biometricEnabled: boolean) => {
    try {
      const existing = await getWalletMetadata();
      const metadata = existing ? JSON.parse(existing) : {};
      metadata.biometricEnabled = biometricEnabled;
      await storeWalletMetadata(JSON.stringify(metadata));
      settingsDispatch({
        type: 'SET_BIOMETRICS_ENABLED',
        payload: biometricEnabled,
      });
      await syncPersistedAuthState();
      await AsyncStorage.setItem(ASYNC_KEYS.ONBOARDING_COMPLETED, 'true');
      markOnboardingComplete();
    } catch {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const handleEnableBiometric = async () => {
    setIsEnabling(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        await completeOnboarding(true);
      } else {
        Alert.alert(
          'Authentication Failed',
          'Biometric verification failed. You can still use your PIN.',
        );
      }
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding(false);
  };

  if (biometricAvailable === null) {
    return (
      <GradientBackground glow>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground glow>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.huge,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}>
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Ionicons
              name={biometricAvailable ? 'finger-print-outline' : 'checkmark-circle-outline'}
              size={28}
              color={colors.primary}
            />
          </View>

          <Text style={styles.headline}>
            {biometricAvailable
              ? 'Unlock with\nbiometrics?'
              : "You're all set!"}
          </Text>
          <Text style={styles.subtitle}>
            {biometricAvailable
              ? 'Use Face ID or fingerprint to quickly unlock your wallet instead of entering your PIN every time.'
              : 'Biometric authentication is not available on this device. Your PIN will be used to unlock the wallet.'}
          </Text>

          {biometricAvailable && (
            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.textTertiary}
                />
                <Text style={styles.featureText}>Faster access to your wallet</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textTertiary}
                />
                <Text style={styles.featureText}>PIN still available as backup</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttons}>
          {biometricAvailable ? (
            <>
              <Button
                title="Enable Biometrics"
                onPress={handleEnableBiometric}
                loading={isEnabling}
                disabled={isEnabling}
                icon="finger-print-outline"
                style={styles.btn}
              />
              <Button
                title="Skip for Now"
                onPress={handleSkip}
                variant="ghost"
                disabled={isEnabling}
                style={styles.btn}
              />
            </>
          ) : (
            <Button
              title="Go to Dashboard"
              onPress={handleSkip}
              style={styles.btn}
            />
          )}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featureList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
  },
  buttons: {
    gap: spacing.md,
  },
  btn: {
    borderRadius: 50,
  },
});
