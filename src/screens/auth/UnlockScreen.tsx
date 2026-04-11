import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthContext } from '@context/AuthContext';

const PIN_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function UnlockScreen() {
  const {
    isLockedOut,
    remainingLockoutMs,
    biometricAvailable,
    failedAttempts,
    authenticateWithPin,
    authenticateWithBiometric,
    syncPersistedAuthState,
  } = useAuthContext();

  const attemptsRemaining = Math.max(0, 3 - failedAttempts);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(remainingLockoutMs);
  /** Context `isLockedOut` does not tick with wall clock; combine with local countdown for UX. */
  const lockoutActive = isLockedOut && lockoutRemaining > 0;

  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRef = useRef(syncPersistedAuthState);
  syncRef.current = syncPersistedAuthState;

  useFocusEffect(
    useCallback(() => {
      void syncPersistedAuthState();
    }, [syncPersistedAuthState]),
  );

  // Tick lockout countdown every second
  useEffect(() => {
    if (isLockedOut) {
      setLockoutRemaining(remainingLockoutMs);
      lockoutTimerRef.current = setInterval(() => {
        setLockoutRemaining((prev) => {
          const next = Math.max(0, prev - 1000);
          if (next === 0 && lockoutTimerRef.current) {
            clearInterval(lockoutTimerRef.current);
            lockoutTimerRef.current = null;
            void syncRef.current();
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [isLockedOut, remainingLockoutMs]);

  // Auto biometric once when user preference + hardware allow and not in active lockout countdown
  const didAutoBiometricRef = useRef(false);
  useEffect(() => {
    if (!biometricAvailable) {
      didAutoBiometricRef.current = false;
      return;
    }
    if (didAutoBiometricRef.current) return;
    if (!lockoutActive) {
      didAutoBiometricRef.current = true;
      handleBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricAvailable, lockoutActive]);

  const handleBiometric = async () => {
    setIsVerifying(true);
    try {
      await authenticateWithBiometric();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKey = (key: string) => {
    if (isVerifying || lockoutActive) return;
    setError('');

    if (key === '⌫') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '') return;
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      submitPin(next);
    }
  };

  const submitPin = async (enteredPin: string) => {
    setIsVerifying(true);
    try {
      const valid = await authenticateWithPin(enteredPin);
      if (!valid) {
        Vibration.vibrate(300);
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const lockoutSecs = Math.ceil(lockoutRemaining / 1000);
  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  if (lockoutActive) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.title}>Too Many Attempts</Text>
          <Text style={styles.subtitle}>
            Too many incorrect PIN entries. Try again in{' '}
            <Text style={styles.countdown}>{lockoutSecs}s</Text>.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Unlock Wallet</Text>
        <Text style={styles.subtitle}>
          {biometricAvailable
            ? 'Use Face ID / fingerprint or enter your PIN'
            : 'Enter your PIN to access your wallet'}
        </Text>

        {failedAttempts > 0 && attemptsRemaining > 0 && (
          <Text style={styles.attemptsWarning}>
            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
          </Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isVerifying ? (
          <ActivityIndicator size="large" color="#F7931A" style={styles.spinner} />
        ) : (
          <View style={styles.dotsRow}>
            {dots.map((filled, i) => (
              <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
            ))}
          </View>
        )}

        <View style={styles.keypad}>
          {KEYS.map((key, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.key, key === '' && styles.keyInvisible]}
              onPress={() => handleKey(key)}
              disabled={key === '' || isVerifying || lockoutActive}
              accessibilityRole="button"
              accessibilityLabel={key === '⌫' ? 'Delete' : key}
            >
              <Text style={[styles.keyText, key === '⌫' && styles.keyDelete]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometric}
            disabled={isVerifying || lockoutActive}
            accessibilityRole="button"
          >
            <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
          </TouchableOpacity>
        )}
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
  lockIcon: { fontSize: 64, marginTop: 40 },
  title: { fontSize: 26, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8 },
  countdown: { color: '#FF6666', fontWeight: '700' },
  attemptsWarning: {
    color: '#FF9900',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  error: {
    color: '#FF6666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  spinner: { marginVertical: 24 },
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
  biometricButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  biometricText: { color: '#F7931A', fontSize: 15, fontWeight: '600' },
});
