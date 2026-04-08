import React, { useRef, useState } from 'react';
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
import { validateMnemonic } from '@services/mnemonicService';
import { storeMnemonic, storePassphrase } from '@services/secureStorageService';
import { initializeWallet, mapSdkError } from '@services/walletService';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'RestoreWallet'>;
type WordCount = 12 | 24;

type InitStep = 'idle' | 'storing' | 'initializing' | 'syncing';

const STEP_LABELS: Record<InitStep, string> = {
  idle: '',
  storing: 'Securing wallet…',
  initializing: 'Initializing wallet…',
  syncing: 'Syncing transaction history…',
};

export default function RestoreWalletScreen({ navigation }: Props) {
  const [wordCount, setWordCount] = useState<WordCount>(12);
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [invalidWords, setInvalidWords] = useState<Set<number>>(new Set());
  const [mnemonicError, setMnemonicError] = useState('');
  const [initStep, setInitStep] = useState<InitStep>('idle');
  const [initError, setInitError] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isBusy = initStep !== 'idle';

  const handleWordCountChange = (count: WordCount) => {
    setWordCount(count);
    setWords(Array(count).fill(''));
    setInvalidWords(new Set());
    setMnemonicError('');
  };

  const handleWordChange = (index: number, value: string) => {
    // Auto-advance on space: paste the word into the current slot, move to next
    if (value.includes(' ')) {
      const trimmed = value.replace(/\s+/g, '').toLowerCase();
      const updated = [...words];
      updated[index] = trimmed;
      setWords(updated);
      if (index < wordCount - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }
    const updated = [...words];
    updated[index] = value.toLowerCase();
    setWords(updated);
    const newInvalid = new Set(invalidWords);
    newInvalid.delete(index);
    setInvalidWords(newInvalid);
    setMnemonicError('');
  };

  const handleRestore = async () => {
    const mnemonic = words.map((w) => w.trim()).join(' ');
    const isValid = validateMnemonic(mnemonic);

    if (!isValid) {
      setMnemonicError(
        'Invalid recovery phrase. Please check each word and try again.',
      );
      return;
    }

    setInitError('');
    try {
      // 1. Persist mnemonic (AES-256-GCM encrypted)
      setInitStep('storing');
      await storeMnemonic(mnemonic);

      // 2. Persist passphrase so future restorations use the same derivation
      //    parameters. An empty string clears any previously stored passphrase.
      await storePassphrase(passphrase);

      // 3. Derive wallet keys and connect to Breez Spark, passing the
      //    passphrase so the correct HD wallet branch is used from the start.
      setInitStep('initializing');
      await initializeWallet();

      setInitStep('syncing');
      // Allow the SDK a moment to begin its initial sync before navigating
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      navigation.navigate('PinSetup');
    } catch (err) {
      const message = mapSdkError(err, 'wallet restore');
      setInitError(message);
      Alert.alert('Restore Failed', message);
    } finally {
      setInitStep('idle');
    }
  };

  const columns = 3;
  const rows: number[][] = [];
  for (let i = 0; i < wordCount; i += columns) {
    rows.push(Array.from({ length: columns }, (_, j) => i + j).filter((n) => n < wordCount));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isBusy}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Restore Wallet</Text>
        <Text style={styles.subtitle}>
          Enter your recovery phrase words in the correct order.
        </Text>

        <View style={styles.toggleRow}>
          {([12, 24] as WordCount[]).map((count) => (
            <TouchableOpacity
              key={count}
              style={[styles.toggleChip, wordCount === count && styles.toggleChipSelected]}
              onPress={() => handleWordCountChange(count)}
              disabled={isBusy}
            >
              <Text style={[styles.toggleChipText, wordCount === count && styles.toggleChipTextSelected]}>
                {count} words
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((wordIdx) => (
                <View key={wordIdx} style={styles.wordInputContainer}>
                  <Text style={styles.wordNumber}>{wordIdx + 1}</Text>
                  <TextInput
                    ref={(el) => { inputRefs.current[wordIdx] = el; }}
                    style={[
                      styles.wordInput,
                      invalidWords.has(wordIdx) && styles.wordInputError,
                    ]}
                    value={words[wordIdx]}
                    onChangeText={(v) => handleWordChange(wordIdx, v)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    editable={!isBusy}
                    returnKeyType={wordIdx < wordCount - 1 ? 'next' : 'done'}
                    onSubmitEditing={() => {
                      if (wordIdx < wordCount - 1) {
                        inputRefs.current[wordIdx + 1]?.focus();
                      }
                    }}
                    blurOnSubmit={wordIdx === wordCount - 1}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>

        {mnemonicError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{mnemonicError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.passphraseToggle}
          onPress={() => setShowPassphrase((s) => !s)}
          disabled={isBusy}
        >
          <Text style={styles.passphraseToggleText}>
            {showPassphrase ? '▼' : '▶'} Advanced: BIP39 Passphrase (optional)
          </Text>
        </TouchableOpacity>

        {showPassphrase && (
          <View style={styles.passphraseSection}>
            <Text style={styles.passphraseLabel}>
              Passphrase adds an extra layer of security. Leave blank if not used.
            </Text>
            <TextInput
              style={styles.passphraseInput}
              value={passphrase}
              onChangeText={setPassphrase}
              placeholder="Optional passphrase"
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              editable={!isBusy}
            />
          </View>
        )}

        {isBusy ? (
          <View style={styles.progressBox}>
            <ActivityIndicator color="#F7931A" />
            <Text style={styles.progressText}>{STEP_LABELS[initStep]}</Text>
          </View>
        ) : (
          <View style={styles.syncNote}>
            <Text style={styles.syncNoteText}>
              After restoring, your wallet will sync transaction history automatically.
            </Text>
          </View>
        )}

        {initError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{initError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.restoreButton, isBusy && styles.restoreButtonDisabled]}
          onPress={handleRestore}
          disabled={isBusy}
          accessibilityRole="button"
        >
          <Text style={styles.restoreButtonText}>
            {isBusy ? STEP_LABELS[initStep] : 'Restore Wallet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16, gap: 20 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: '#F7931A', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', lineHeight: 20 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  toggleChipSelected: { borderColor: '#F7931A', backgroundColor: '#1F1500' },
  toggleChipText: { color: '#888', fontSize: 14, fontWeight: '600' },
  toggleChipTextSelected: { color: '#F7931A' },
  grid: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  wordInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  wordNumber: { fontSize: 10, color: '#555', width: 16, textAlign: 'right' },
  wordInput: { flex: 1, color: '#FFF', fontSize: 13, padding: 0 },
  wordInputError: { borderColor: '#FF4444' },
  errorBox: {
    backgroundColor: '#1A0000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF444444',
    padding: 12,
  },
  errorText: { color: '#FF6666', fontSize: 14, lineHeight: 20 },
  passphraseToggle: { paddingVertical: 4 },
  passphraseToggleText: { color: '#666', fontSize: 13 },
  passphraseSection: { gap: 8 },
  passphraseLabel: { fontSize: 13, color: '#666', lineHeight: 18 },
  passphraseInput: {
    backgroundColor: '#161616',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#FFF',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
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
  syncNote: {
    backgroundColor: '#0D1A0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A3A1A',
    padding: 12,
  },
  syncNoteText: { color: '#4CAF50', fontSize: 13, lineHeight: 18 },
  restoreButton: {
    backgroundColor: '#F7931A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  restoreButtonDisabled: { opacity: 0.6 },
  restoreButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
