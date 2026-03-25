import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {PinPad} from '@components/onboarding/PinPad';
import {useAuth} from '@context/AuthContext';
import {colors, spacing, typography} from '@theme/index';

const PIN_LENGTH = 6;

export function PinEntryScreen() {
  const insets = useSafeAreaInsets();
  const {state, dispatch, verifyPin, authenticateWithBiometrics} = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePress = useCallback(
    (digit: string) => {
      setError('');
      if (pin.length < PIN_LENGTH) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === PIN_LENGTH) {
          if (verifyPin(newPin)) {
            dispatch({type: 'AUTHENTICATE'});
          } else {
            setError('Incorrect PIN');
            setPin('');
          }
        }
      }
    },
    [pin, verifyPin, dispatch],
  );

  const handleDelete = useCallback(() => {
    setError('');
    setPin(prev => prev.slice(0, -1));
  }, []);

  const handleBiometric = useCallback(async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      dispatch({type: 'AUTHENTICATE'});
    }
  }, [authenticateWithBiometrics, dispatch]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.huge,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}>
      <View style={styles.topSection}>
        <View style={styles.logoCircle}>
          <Ionicons name="flash" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Enter PIN</Text>

        <View style={styles.dots}>
          {Array.from({length: PIN_LENGTH}).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length && styles.dotFilled]}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <PinPad
        onPress={handlePress}
        onDelete={handleDelete}
        onBiometric={state.hasBiometrics ? handleBiometric : undefined}
        showBiometric={state.hasBiometrics}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
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
