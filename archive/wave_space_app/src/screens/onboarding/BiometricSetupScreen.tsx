import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {GradientBackground} from '@components/common/GradientBackground';
import {useAuth} from '@context/AuthContext';
import {useWallet} from '@context/WalletContext';
import {Button} from '@components/common/Button';
import {colors, spacing, typography} from '@theme/index';

export function BiometricSetupScreen() {
  const insets = useSafeAreaInsets();
  const {dispatch: authDispatch} = useAuth();
  const {dispatch: walletDispatch} = useWallet();

  const handleEnable = () => {
    authDispatch({type: 'ENABLE_BIOMETRICS'});
    walletDispatch({type: 'SET_INITIALIZED', payload: true});
  };

  const handleSkip = () => {
    walletDispatch({type: 'SET_INITIALIZED', payload: true});
  };

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
              name="finger-print-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.headline}>Unlock with{'\n'}biometrics?</Text>
          <Text style={styles.subtitle}>
            Use Face ID or fingerprint to quickly unlock your wallet instead of
            entering your PIN every time.
          </Text>

          {/* Feature list items with opacity */}
          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.featureText}>Faster access to your wallet</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.featureText}>PIN still available as backup</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttons}>
          <Button
            title="Enable Biometrics"
            onPress={handleEnable}
            icon="finger-print-outline"
            style={styles.btn}
          />
          <Button
            title="Skip for Now"
            onPress={handleSkip}
            variant="ghost"
            style={styles.btn}
          />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
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
