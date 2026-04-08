import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
} from '../services/authService';
import { storeWalletMetadata, getWalletMetadata } from '../services/secureStorageService';
import { ASYNC_KEYS } from '../constants/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'BiometricSetup'>;

export default function BiometricSetupScreen({ navigation }: Props) {
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
      await AsyncStorage.setItem(ASYNC_KEYS.ONBOARDING_COMPLETED, 'true');
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
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
        Alert.alert('Authentication Failed', 'Biometric verification failed. You can still use your PIN.');
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color="#F7931A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{biometricAvailable ? '🔐' : '✅'}</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.title}>
            {biometricAvailable ? 'Enable Biometric Login' : 'You\'re All Set!'}
          </Text>
          <Text style={styles.subtitle}>
            {biometricAvailable
              ? 'Use Face ID or fingerprint to unlock your wallet quickly and securely.'
              : 'Biometric authentication is not available on this device. Your PIN will be used to unlock the wallet.'}
          </Text>
        </View>

        {biometricAvailable ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.enableButton, isEnabling && styles.buttonDisabled]}
              onPress={handleEnableBiometric}
              disabled={isEnabling}
              accessibilityRole="button"
            >
              {isEnabling ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.enableButtonText}>Enable Face ID / Fingerprint</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isEnabling}
              accessibilityRole="button"
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleSkip}
            accessibilityRole="button"
          >
            <Text style={styles.enableButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 48 },
  textGroup: { alignItems: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actions: { width: '100%', gap: 12 },
  enableButton: {
    width: '100%',
    backgroundColor: '#F7931A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  enableButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  skipButton: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  skipButtonText: { color: '#888', fontSize: 16, fontWeight: '600' },
});
