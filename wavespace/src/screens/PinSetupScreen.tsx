import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Vibration,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { hashPin } from '../services/authService';
import { storePinHash } from '../services/secureStorageService';

type Props = NativeStackScreenProps<RootStackParamList, 'PinSetup'>;

const PIN_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

type Step = 'enter' | 'confirm';

export default function PinSetupScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const current = step === 'enter' ? pin : confirmPin;
  const setCurrent = step === 'enter' ? setPin : setConfirmPin;

  const handleKey = (key: string) => {
    if (isSaving) return;
    setError('');

    if (key === '⌫') {
      setCurrent((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '') return;
    if (current.length >= PIN_LENGTH) return;

    const next = current + key;
    setCurrent(next);

    if (next.length === PIN_LENGTH) {
      if (step === 'enter') {
        setTimeout(() => setStep('confirm'), 300);
      } else {
        handleConfirm(next);
      }
    }
  };

  const handleConfirm = async (confirmedPin: string) => {
    if (pin !== confirmedPin) {
      Vibration.vibrate(300);
      setError('PINs do not match. Please try again.');
      setConfirmPin('');
      setStep('enter');
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
  };

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < current.length);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {step === 'enter' ? 'Set Up PIN' : 'Confirm PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'enter'
            ? 'Choose a 6-digit PIN to secure your wallet'
            : 'Re-enter your PIN to confirm'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.dotsRow}>
          {dots.map((filled, i) => (
            <View
              key={i}
              style={[styles.dot, filled && styles.dotFilled]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          {KEYS.map((key, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.key, key === '' && styles.keyInvisible]}
              onPress={() => handleKey(key)}
              disabled={key === '' || isSaving}
              accessibilityRole="button"
              accessibilityLabel={key === '⌫' ? 'Delete' : key}
            >
              <Text style={[styles.keyText, key === '⌫' && styles.keyDelete]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8 },
  error: {
    color: '#FF6666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: '#F7931A', borderColor: '#F7931A' },
  keypad: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyInvisible: { backgroundColor: 'transparent' },
  keyText: { fontSize: 24, color: '#FFF', fontWeight: '500' },
  keyDelete: { fontSize: 20, color: '#F7931A' },
});
