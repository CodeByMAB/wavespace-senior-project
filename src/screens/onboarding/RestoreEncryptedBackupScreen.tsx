import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@components/common/GradientBackground';
import { Header } from '@components/common/Header';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { StepProgressBar } from '@components/common/StepProgressBar';
import { colors, spacing, typography } from '@theme/index';
import { OnboardingStackParamList } from '@navigation/OnboardingStack';
import {
  decryptWaveSpaceBackup,
  WaveBackupDecryptError,
} from '@services/wavespaceBackupService';
import { deleteMnemonic, storeMnemonic, storePassphrase } from '@services/secureStorageService';
import { initializeWallet, mapSdkError } from '@services/walletService';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'RestoreEncryptedBackup'
>;

type InitStep =
  | 'idle'
  | 'decrypting'
  | 'storing'
  | 'initializing'
  | 'syncing';

const STEP_LABELS: Record<Exclude<InitStep, 'idle'>, string> = {
  decrypting: 'Decrypting backup (this can take a moment)…',
  storing: 'Securing wallet…',
  initializing: 'Initializing wallet…',
  syncing: 'Syncing transaction history…',
};

const RESTORE_PROGRESS_STEPS: Exclude<InitStep, 'idle'>[] = [
  'decrypting',
  'storing',
  'initializing',
  'syncing',
];

function isDocumentPickerNativeMissing(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err);
  return (
    m.includes('ExpoDocumentPicker') ||
    m.includes('Cannot find native module') ||
    /native module.*[Dd]ocument/i.test(m)
  );
}

export default function RestoreEncryptedBackupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [backupJson, setBackupJson] = useState('');
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [pickingFile, setPickingFile] = useState(false);
  const [pasteExpanded, setPasteExpanded] = useState(false);
  const [password, setPassword] = useState('');
  const [initStep, setInitStep] = useState<InitStep>('idle');
  const [initError, setInitError] = useState('');

  const isBusy = initStep !== 'idle';
  const hasBackupPayload = backupJson.trim().length > 0;

  const pickBackupFile = async () => {
    setPickingFile(true);
    setInitError('');
    setPasteExpanded(false);
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) {
        return;
      }
      const asset = result.assets[0];
      const text = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setBackupJson(text);
      setPickedFileName(asset.name ?? 'Selected file');
    } catch (err) {
      if (isDocumentPickerNativeMissing(err)) {
        Alert.alert(
          'Rebuild the app',
          'File picking needs the native Expo Document Picker module. Run a fresh native build (for example: npx expo prebuild and npx expo run:ios, or your EAS build), then try again. You can use “Paste JSON instead” until then.',
        );
        return;
      }
      Alert.alert(
        'Could not read file',
        'Choose a JSON backup exported from WaveSpace (Backup / Export).',
      );
    } finally {
      setPickingFile(false);
    }
  };

  const clearBackupSource = () => {
    setBackupJson('');
    setPickedFileName(null);
    setInitError('');
  };

  const openPasteFallback = () => {
    clearBackupSource();
    setPasteExpanded(true);
  };

  const handleRestore = async () => {
    const trimmed = backupJson.trim();
    if (!trimmed) {
      Alert.alert(
        'Backup needed',
        'Choose your encrypted backup file, or use “Paste JSON instead” if you only have the text.',
      );
      return;
    }

    setInitError('');
    let mnemonicStored = false;
    let walletReady = false;

    try {
      setInitStep('decrypting');
      const { mnemonic } = await decryptWaveSpaceBackup(trimmed, password);

      setInitStep('storing');
      await storeMnemonic(mnemonic);
      mnemonicStored = true;

      await storePassphrase('');

      setInitStep('initializing');
      await initializeWallet();
      walletReady = true;

      setInitStep('syncing');
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

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
      const message =
        err instanceof WaveBackupDecryptError
          ? err.message
          : mapSdkError(err, 'wallet restore');
      setInitError(message);
      Alert.alert('Restore Failed', message);
    } finally {
      setInitStep('idle');
    }
  };

  const busyLabel =
    initStep !== 'idle' ? STEP_LABELS[initStep] : '';
  const progressStepIndex =
    initStep === 'idle' ? 0 : RESTORE_PROGRESS_STEPS.indexOf(initStep);

  const showPasteEditor =
    pasteExpanded || (hasBackupPayload && !pickedFileName);

  return (
    <GradientBackground glow>
      <Header title="" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.heroSection}>
          <View style={styles.iconBox}>
            <Ionicons name="document-lock-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headline}>Restore from{'\n'}encrypted backup</Text>
          <Text style={styles.subtitle}>
            Select the backup file you exported from WaveSpace (Settings → Backup / Export),
            then enter the password you set for that file.
          </Text>
        </View>

        <Text style={styles.cardTitle}>BACKUP FILE</Text>
        <View style={styles.backupCard}>
          {isBusy ? (
            <View style={styles.backupCardBusy}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.busyFileTitle} numberOfLines={2}>
                {pickedFileName ?? 'Encrypted backup'}
              </Text>
              <View style={styles.progressInCard}>
                <StepProgressBar
                  currentStep={progressStepIndex}
                  totalSteps={RESTORE_PROGRESS_STEPS.length}
                  label={busyLabel}
                />
              </View>
            </View>
          ) : pickingFile ? (
            <View style={styles.backupCardBusy}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.busyFileTitle}>Loading backup file</Text>
              <Text style={styles.readingHint}>Reading the file from your device…</Text>
            </View>
          ) : (
            <>
              <Button
                title="Choose backup file"
                onPress={() => void pickBackupFile()}
                variant="secondary"
                icon="folder-open-outline"
                disabled={isBusy}
                style={styles.pickBtnInner}
              />

              {pickedFileName && hasBackupPayload ? (
                <View style={styles.fileReadyRow}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <View style={styles.fileReadyText}>
                    <Text style={styles.fileReadyLabel}>Ready to restore</Text>
                    <Text style={styles.filePillText} numberOfLines={2}>
                      {pickedFileName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={clearBackupSource}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Remove backup file">
                    <Ionicons name="close-circle" size={24} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {!showPasteEditor ? (
                <TouchableOpacity
                  style={styles.pasteLink}
                  onPress={openPasteFallback}
                  accessibilityRole="button">
                  <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
                  <Text style={styles.pasteLinkText}>Paste JSON instead</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.pasteHint}>
                    Only if you cannot use a file: paste the full JSON from your backup.
                  </Text>
                  <TextInput
                    style={styles.jsonInput}
                    value={backupJson}
                    onChangeText={(t) => {
                      setBackupJson(t);
                      setInitError('');
                    }}
                    placeholder='{ "version": 2, ... }'
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    textAlignVertical="top"
                    editable={!isBusy}
                  />
                  {pasteExpanded || (hasBackupPayload && !pickedFileName) ? (
                    <TouchableOpacity
                      style={styles.pasteLink}
                      onPress={() => {
                        setPasteExpanded(false);
                        clearBackupSource();
                      }}
                      accessibilityRole="button">
                      <Text style={styles.pasteLinkTextMuted}>Use file upload instead</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </>
          )}
        </View>

        {!isBusy ? (
          <>
            <Input
              label="Export password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              containerStyle={styles.inputBlock}
            />

            <View style={styles.syncNote}>
              <Text style={styles.syncNoteText}>
                Transaction history inside the file is not imported; your wallet will sync from
                the network after restore.
              </Text>
            </View>
          </>
        ) : null}

        {initError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{initError}</Text>
          </View>
        ) : null}

        {!isBusy ? (
          <Button
            title="Restore from backup"
            onPress={() => void handleRestore()}
            disabled={pickingFile || !hasBackupPayload}
            icon="lock-open-outline"
            style={styles.btn}
          />
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
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
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: -spacing.sm,
  },
  backupCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  backupCardBusy: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  progressInCard: {
    alignSelf: 'stretch',
    width: '100%',
  },
  busyFileTitle: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  readingHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  pickBtnInner: {
    borderRadius: 50,
  },
  fileReadyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fileReadyText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  fileReadyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
    letterSpacing: 0.4,
  },
  filePillText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  pasteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pasteLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  pasteLinkTextMuted: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  pasteHint: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  jsonInput: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputBlock: {
    marginBottom: 0,
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
  btn: {
    borderRadius: 50,
  },
});
