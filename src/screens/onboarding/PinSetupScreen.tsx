import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, Vibration, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {GradientBackground} from '@components/common/GradientBackground';
import {PinPad} from '@components/onboarding/PinPad';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';
import {OnboardingStackParamList} from '@navigation/OnboardingStack';
import {hashPin} from '@services/authService';
import {storePinHash} from '@services/secureStorageService';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PinSetup'>;

const PIN_LENGTH = 6;

export default function PinSetupScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentPin = isConfirming ? confirmPin : pin;

  const handleConfirm = useCallback(
    async (confirmedPin: string) => {
      if (confirmedPin !== pin) {
        Vibration.vibrate(300);
        setError('PINs do not match. Try again.');
        setConfirmPin('');
        setIsConfirming(false);
        setPin('');
        return;
      }

      setIsSaving(true);
      try {
        const hash = await hashPin(pin);
        await storePinHash(hash);
        navigation.navigate('BiometricSetup');
      } catch {
        Alert.alert('Error', 'Failed to set up PIN. Please try again.');
        setIsSaving(false);
      }
    },
    [pin, navigation],
  );

  const handlePress = useCallback(
    (digit: string) => {
      if (isSaving) return;
      setError('');
      if (isConfirming) {
        if (confirmPin.length < PIN_LENGTH) {
          const newPin = confirmPin + digit;
          setConfirmPin(newPin);
          if (newPin.length === PIN_LENGTH) {
            handleConfirm(newPin);
          }
        }
      } else {
        if (pin.length < PIN_LENGTH) {
          const newPin = pin + digit;
          setPin(newPin);
          if (newPin.length === PIN_LENGTH) {
            setIsConfirming(true);
          }
        }
      }
    },
    [pin, confirmPin, isConfirming, isSaving, handleConfirm],
  );

  const handleDelete = useCallback(() => {
    if (isSaving) return;
    setError('');
    if (isConfirming) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  }, [isConfirming, isSaving]);

  return (
    <GradientBackground glow>
      <View
        style={[
          styles.container,
          {paddingTop: insets.top + spacing.huge, paddingBottom: insets.bottom + spacing.xl},
        ]}>
        <View style={styles.topSection}>
          <View style={styles.iconBox}>
            <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
          </View>

          <Text style={styles.title}>
            {isConfirming ? 'Confirm\nyour PIN' : 'Create\na PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {isConfirming
              ? 'Enter your PIN again to confirm'
              : 'Set a 6-digit PIN to secure your wallet'}
          </Text>

          <View style={styles.dots}>
            {Array.from({length: PIN_LENGTH}).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentPin.length && styles.dotFilled,
                ]}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PinPad onPress={handlePress} onDelete={handleDelete} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
  },
});
