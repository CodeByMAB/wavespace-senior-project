import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@navigation/OnboardingStack';
import { mnemonicToWords } from '@services/mnemonicService';
import { storeMnemonic } from '@services/secureStorageService';
import { initializeWallet, mapSdkError } from '@services/walletService';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'MnemonicConfirm'>;

const NUM_PROMPTS = 3;

type InitStep = 'idle' | 'storing' | 'initializing' | 'syncing';

const STEP_LABELS: Record<InitStep, string> = {
  idle: '',
  storing: 'Securing wallet…',
  initializing: 'Initializing wallet…',
  syncing: 'Syncing…',
};

function pickRandomIndices(total: number, count: number): number[] {
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count).sort((a, b) => a - b);
}

export default function MnemonicConfirmScreen({ navigation, route }: Props) {
  const { mnemonic } = route.params;
  const words = useMemo(() => mnemonicToWords(mnemonic), [mnemonic]);
  const promptIndices = useMemo(() => pickRandomIndices(words.length, NUM_PROMPTS), [words]);

  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, boolean>>({});
  const [initStep, setInitStep] = useState<InitStep>('idle');
  const [initError, setInitError] = useState('');

  const isBusy = initStep !== 'idle';

  const handleChange = (index: number, value: string) => {
    setInputs((prev) => ({ ...prev, [index]: value.trim().toLowerCase() }));
    setErrors((prev) => ({ ...prev, [index]: false }));
  };

  const handleVerify = async () => {
    const newErrors: Record<number, boolean> = {};
    let allCorrect = true;

    for (const idx of promptIndices) {
      const correct = words[idx].toLowerCase();
      if ((inputs[idx] ?? '').toLowerCase() !== correct) {
        newErrors[idx] = true;
        allCorrect = false;
      }
    }

    setErrors(newErrors);

    if (!allCorrect) {
      Alert.alert('Incorrect Words', 'Some words do not match. Please try again.');
      return;
    }

    setInitError('');
    try {
      // 1. Persist mnemonic (AES-256-GCM encrypted)
      setInitStep('storing');
      await storeMnemonic(mnemonic);

      // 2. Derive wallet keys and start Breez Spark sync (new wallet, no
      //    passphrase — the user may add one later via settings).
      setInitStep('initializing');
      await initializeWallet();

      setInitStep('syncing');
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      navigation.navigate('PinSetup');
    } catch (err) {
      const message = mapSdkError(err, 'wallet setup');
      setInitError(message);
      Alert.alert('Setup Failed', message);
    } finally {
      setInitStep('idle');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isBusy}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Confirm Recovery Phrase</Text>
        <Text style={styles.subtitle}>
          Enter the words at the positions below to verify you have written down your
          recovery phrase correctly.
        </Text>

        <View style={styles.prompts}>
          {promptIndices.map((wordIdx) => (
            <View key={wordIdx} style={styles.promptRow}>
              <Text style={styles.promptLabel}>Word #{wordIdx + 1}</Text>
              <TextInput
                style={[styles.input, errors[wordIdx] && styles.inputError]}
                value={inputs[wordIdx] ?? ''}
                onChangeText={(v) => handleChange(wordIdx, v)}
                placeholder={`Enter word #${wordIdx + 1}`}
                placeholderTextColor="#555"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                editable={!isBusy}
              />
              {errors[wordIdx] && (
                <Text style={styles.errorText}>Incorrect word</Text>
              )}
            </View>
          ))}
        </View>

        {isBusy && (
          <View style={styles.progressBox}>
            <ActivityIndicator color="#F7931A" />
            <Text style={styles.progressText}>{STEP_LABELS[initStep]}</Text>
          </View>
        )}

        {initError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{initError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.verifyButton, isBusy && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isBusy}
          accessibilityRole="button"
        >
          {isBusy ? (
            <Text style={styles.verifyButtonText}>{STEP_LABELS[initStep]}</Text>
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16, gap: 24 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: '#F7931A', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', lineHeight: 20 },
  prompts: { gap: 20 },
  promptRow: { gap: 8 },
  promptLabel: {
    fontSize: 13,
    color: '#F7931A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#161616',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: { borderColor: '#FF4444' },
  errorText: { color: '#FF4444', fontSize: 12 },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0D1A0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A3A1A',
    padding: 14,
  },
  progressText: { color: '#4CAF50', fontSize: 14 },
  errorBox: {
    backgroundColor: '#1A0000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF444444',
    padding: 12,
  },
  errorBoxText: { color: '#FF6666', fontSize: 14, lineHeight: 20 },
  verifyButton: {
    marginTop: 'auto',
    backgroundColor: '#F7931A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  verifyButtonDisabled: { opacity: 0.6 },
  verifyButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
