import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Vibration, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '@/types/navigation';
import { Header } from '@components/common/Header';
import { PinPad } from '@components/onboarding/PinPad';
import { hashPin, verifyPin } from '@services/authService';
import { getPinHash, storePinHash } from '@services/secureStorageService';
import { colors, spacing, typography } from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;
type Step = 'current' | 'new' | 'confirm';

const PIN_LENGTH = 6;

export function ChangePINScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('current');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const newPinRef = useRef('');

  const title =
    step === 'current'
      ? 'Enter current PIN'
      : step === 'new'
        ? 'Enter new PIN'
        : 'Confirm new PIN';

  const currentLength =
    step === 'current' ? pin.length : step === 'new' ? newPin.length : confirmPin.length;

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < currentLength);

  const runAfterFullPin = useCallback(
    async (atStep: Step, value: string) => {
      if (busy) return;
      setBusy(true);
      setError('');
      try {
        if (atStep === 'current') {
          const hash = await getPinHash();
          if (!hash) {
            Alert.alert('Error', 'No PIN is set.');
            navigation.goBack();
            return;
          }
          const ok = await verifyPin(value, hash);
          if (!ok) {
            Vibration.vibrate(300);
            setError('Incorrect PIN. Please try again.');
            setPin('');
            return;
          }
          setPin('');
          setStep('new');
          return;
        }

        if (atStep === 'new') {
          newPinRef.current = value;
          setNewPin(value);
          setStep('confirm');
          return;
        }

        const candidate = newPinRef.current;
        if (value !== candidate) {
          Vibration.vibrate(300);
          setError('PINs do not match. Enter a new PIN again.');
          setConfirmPin('');
          setNewPin('');
          newPinRef.current = '';
          setStep('new');
          return;
        }

        const nextHash = await hashPin(candidate);
        await storePinHash(nextHash);
        Alert.alert('PIN updated', 'Your PIN has been changed.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, navigation],
  );

  const onDigit = (digit: string) => {
    if (busy) return;
    setError('');

    if (step === 'current') {
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) {
          void runAfterFullPin('current', next);
        }
        return next;
      });
      return;
    }
    if (step === 'new') {
      setNewPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) {
          void runAfterFullPin('new', next);
        }
        return next;
      });
      return;
    }
    setConfirmPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + digit;
      if (next.length === PIN_LENGTH) {
        void runAfterFullPin('confirm', next);
      }
      return next;
    });
  };

  const onDelete = () => {
    if (busy) return;
    setError('');
    if (step === 'current') setPin((p) => p.slice(0, -1));
    else if (step === 'new') setNewPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <Header title="Change PIN" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.dotsRow}>
          {dots.map((filled, i) => (
            <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
          ))}
        </View>
        <PinPad onPress={onDigit} onDelete={onDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  error: {
    ...typography.bodyMedium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
