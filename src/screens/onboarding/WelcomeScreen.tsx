import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <Text style={styles.appName}>Wavespace</Text>
          <Text style={styles.tagline}>Your self-custodial Lightning wallet</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('CreateWallet')}
            accessibilityRole="button"
            accessibilityLabel="Create a new wallet"
          >
            <Text style={styles.primaryButtonText}>Create New Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('RestoreWallet')}
            accessibilityRole="button"
            accessibilityLabel="Restore an existing wallet"
          >
            <Text style={styles.secondaryButtonText}>Restore Existing Wallet</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Wavespace is non-custodial. You are solely responsible for your funds.
        </Text>
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#F7931A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
