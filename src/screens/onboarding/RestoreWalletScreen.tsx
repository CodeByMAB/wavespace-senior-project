import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {GradientBackground} from '@components/common/GradientBackground';
import {Header} from '@components/common/Header';
import {Button} from '@components/common/Button';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';
import {OnboardingStackParamList} from '@navigation/OnboardingStack';
import {validateMnemonic} from '@services/mnemonicService';
import {deleteMnemonic, storeMnemonic, storePassphrase} from '@services/secureStorageService';
import {disconnectWallet, initializeWallet, mapSdkError} from '@services/walletService';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'RestoreWallet'>;
type WordCount = 12 | 24;

type InitStep = 'idle' | 'storing' | 'initializing' | 'syncing';

const STEP_LABELS: Record<InitStep, string> = {
  idle: '',
  storing: 'Securing wallet\u2026',
  initializing: 'Initializing wallet\u2026',
  syncing: 'Syncing transaction history\u2026',
};

export default function RestoreWalletScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
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
    const mnemonic = words.map(w => w.trim()).join(' ');
    const isValid = validateMnemonic(mnemonic);

    if (!isValid) {
      setMnemonicError(
        'Invalid recovery phrase. Please check each word and try again.',
      );
      return;
    }

    setInitError('');
    let mnemonicStored = false;
    let walletReady = false;
    try {
      setInitStep('storing');
      await storeMnemonic(mnemonic);
      mnemonicStored = true;

      await storePassphrase(passphrase);

      setInitStep('initializing');
      await initializeWallet();
      walletReady = true;

      setInitStep('syncing');
      await new Promise<void>(resolve => setTimeout(resolve, 1500));

      try {
        await disconnectWallet();
      } catch {
        // Best-effort; useWallet reconnects after unlock.
      }

      navigation.navigate('PinSetup');
    } catch (err) {
      if (mnemonicStored && !walletReady) {
        try {
          await deleteMnemonic();
          await storePassphrase('');
        } catch {
          // Best-effort cleanup
        }
      }
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
    rows.push(
      Array.from({length: columns}, (_, j) => i + j).filter(n => n < wordCount),
    );
  }

  return (
    <GradientBackground glow>
      <Header title="" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xxl},
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.heroSection}>
          <View style={styles.iconBox}>
            <Ionicons name="download-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headline}>Restore{'\n'}your wallet</Text>
          <Text style={styles.subtitle}>
            Enter your recovery phrase words in the correct order.
          </Text>
        </View>

        <View style={styles.toggleRow}>
          {([12, 24] as WordCount[]).map(count => (
            <TouchableOpacity
              key={count}
              style={[
                styles.toggleChip,
                wordCount === count && styles.toggleChipSelected,
              ]}
              onPress={() => handleWordCountChange(count)}
              disabled={isBusy}>
              <Text
                style={[
                  styles.toggleChipText,
                  wordCount === count && styles.toggleChipTextSelected,
                ]}>
                {count} words
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map(wordIdx => (
                <View key={wordIdx} style={styles.wordInputContainer}>
                  <Text style={styles.wordNumber}>{wordIdx + 1}</Text>
                  <TextInput
                    ref={el => {
                      inputRefs.current[wordIdx] = el;
                    }}
                    style={[
                      styles.wordInput,
                      invalidWords.has(wordIdx) && styles.wordInputError,
                    ]}
                    value={words[wordIdx]}
                    onChangeText={v => handleWordChange(wordIdx, v)}
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
                    placeholderTextColor={colors.textTertiary}
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
          onPress={() => setShowPassphrase(s => !s)}
          disabled={isBusy}>
          <Ionicons
            name={showPassphrase ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={colors.textTertiary}
          />
          <Text style={styles.passphraseToggleText}>
            Advanced: BIP39 Passphrase (optional)
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
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              editable={!isBusy}
            />
          </View>
        )}

        {isBusy ? (
          <View style={styles.progressBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.progressText}>{STEP_LABELS[initStep]}</Text>
          </View>
        ) : (
          <View style={styles.syncNote}>
            <Text style={styles.syncNoteText}>
              After restoring, your wallet will sync transaction history
              automatically.
            </Text>
          </View>
        )}

        {initError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{initError}</Text>
          </View>
        ) : null}

        <Button
          title={isBusy ? STEP_LABELS[initStep] : 'Restore Wallet'}
          onPress={handleRestore}
          disabled={isBusy}
          loading={isBusy}
          icon="refresh-outline"
          style={styles.btn}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  heroSection: {
    gap: spacing.md,
    marginTop: spacing.md,
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
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  toggleChipText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleChipTextSelected: {
    color: colors.primary,
  },
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  wordInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  wordNumber: {
    fontSize: 10,
    color: colors.textTertiary,
    width: 16,
    textAlign: 'right',
  },
  wordInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  wordInputError: {
    borderColor: colors.error,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  passphraseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  passphraseToggleText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  passphraseSection: {
    gap: spacing.sm,
  },
  passphraseLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  passphraseInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  progressText: {
    color: colors.success,
    fontSize: 14,
  },
  syncNote: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  syncNoteText: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
  },
  btn: {
    borderRadius: 50,
  },
});
