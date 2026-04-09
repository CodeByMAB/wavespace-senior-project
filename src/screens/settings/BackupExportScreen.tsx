import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ScreenCapture from 'expo-screen-capture';
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha256.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '@/types/navigation';
import type { Transaction } from '@/types/wallet';
import { Header } from '@components/common/Header';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { MnemonicGrid } from '@components/onboarding/MnemonicGrid';
import { getMnemonic } from '@services/secureStorageService';
import { useSettings } from '@context/SettingsContext';
import { useWallet } from '@context/WalletContext';
import { colors, spacing, typography } from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const BACKUP_VERSION = 2;
const PBKDF_ITERATIONS = 100_000;
const KDF_NAME = 'PBKDF2-HMAC-SHA256';
const KDF_PRF = 'HMAC-SHA256';
const AES_CIPHER = 'AES-256-GCM';
const DK_LEN_BYTES = 32;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  return pbkdf2Async(sha256, passwordBytes, salt, {
    c: PBKDF_ITERATIONS,
    dkLen: DK_LEN_BYTES,
  });
}

function encryptUtf8AesGcm(key: Uint8Array, plaintext: string): {
  nonceB64: string;
  ciphertextB64: string;
} {
  const nonce = randomBytes(12);
  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(new TextEncoder().encode(plaintext));
  return {
    nonceB64: bytesToBase64(nonce),
    ciphertextB64: bytesToBase64(ciphertext),
  };
}

export function BackupExportScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { state: settings } = useSettings();
  const { state: walletState } = useWallet();
  const [phraseModal, setPhraseModal] = useState(false);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [loadingPhrase, setLoadingPhrase] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportConfirm, setExportConfirm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [includeTransactionHistory, setIncludeTransactionHistory] = useState(false);

  useEffect(() => {
    if (!phraseModal) return;
    void ScreenCapture.preventScreenCaptureAsync();
    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
  }, [phraseModal]);

  const revealPhrase = async () => {
    setLoadingPhrase(true);
    try {
      const m = await getMnemonic();
      if (!m) {
        Alert.alert('Unavailable', 'Could not load recovery phrase.');
        return;
      }
      setMnemonicWords(m.trim().split(/\s+/));
      setPhraseModal(true);
    } finally {
      setLoadingPhrase(false);
    }
  };

  const runExport = async () => {
    if (!exportPassword || exportPassword.length < 8) {
      Alert.alert('Password', 'Use a password with at least 8 characters.');
      return;
    }
    if (exportPassword !== exportConfirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setExporting(true);
    try {
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        Alert.alert('Error', 'Could not read wallet secret.');
        return;
      }

      const salt = randomBytes(16);
      const key = await deriveKeyFromPassword(exportPassword, salt);

      const inner: { mnemonic: string; transactions?: Transaction[] } = {
        mnemonic: mnemonic.trim(),
      };
      if (includeTransactionHistory) {
        inner.transactions = walletState.transactions;
      }
      const plaintext = JSON.stringify(inner);

      const { nonceB64, ciphertextB64 } = encryptUtf8AesGcm(key, plaintext);

      const checksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        mnemonic.trim(),
        { encoding: Crypto.CryptoEncoding.HEX },
      );

      const payload = {
        version: BACKUP_VERSION,
        network: settings.network,
        kdf: {
          name: KDF_NAME,
          prf: KDF_PRF,
          iterations: PBKDF_ITERATIONS,
          salt_b64: bytesToBase64(salt),
          dk_len_bytes: DK_LEN_BYTES,
        },
        cipher: AES_CIPHER,
        encrypted_payload_b64: ciphertextB64,
        nonce: nonceB64,
        checksum,
        includes_transaction_history: includeTransactionHistory,
        pbkdf2_iterations: PBKDF_ITERATIONS,
        created_at: new Date().toISOString(),
      };

      const json = JSON.stringify(payload, null, 2);
      const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!base) {
        Alert.alert('Error', 'No writable directory available.');
        return;
      }
      const uri = `${base}wavespace-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing unavailable', 'Export file was written but sharing is not available.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Encrypted backup',
      });
    } catch {
      Alert.alert('Export failed', 'Could not create or share the backup file.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.root}>
      <Header title="Backup / Export" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>RECOVERY PHRASE</Text>
        <Text style={styles.hint}>
          Anyone with your phrase can spend your funds. Only view in a private place.
        </Text>
        <Button
          title={loadingPhrase ? 'Loading…' : 'View recovery phrase'}
          onPress={() => void revealPhrase()}
          disabled={loadingPhrase}
        />
        {loadingPhrase ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : null}

        <Text style={[styles.sectionTitle, styles.marginTop]}>ENCRYPTED BACKUP</Text>
        <Text style={styles.hint}>
          Encrypts your phrase with your password. Store the file and password separately.
          PBKDF2-HMAC-SHA256 with {PBKDF_ITERATIONS.toLocaleString('en-US')} iterations protects the key.
        </Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextBlock}>
            <Text style={styles.toggleLabel}>Include transaction history</Text>
            <Text style={styles.toggleHint}>
              Adds your current transaction list inside the encrypted payload.
            </Text>
          </View>
          <Switch
            value={includeTransactionHistory}
            onValueChange={setIncludeTransactionHistory}
            trackColor={{ false: colors.border, true: colors.primaryDark }}
            thumbColor={
              includeTransactionHistory ? colors.primary : colors.textTertiary
            }
          />
        </View>
        <Input
          label="Password"
          secureTextEntry
          value={exportPassword}
          onChangeText={setExportPassword}
          autoCapitalize="none"
          containerStyle={styles.inputBlock}
        />
        <Input
          label="Confirm password"
          secureTextEntry
          value={exportConfirm}
          onChangeText={setExportConfirm}
          autoCapitalize="none"
          containerStyle={styles.inputBlock}
        />
        <Button
          title={exporting ? 'Exporting…' : 'Export encrypted backup'}
          onPress={() => void runExport()}
          disabled={exporting}
        />

        <Modal
          visible={phraseModal}
          animationType="slide"
          transparent
          onRequestClose={() => setPhraseModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.lg }]}>
              <Text style={styles.modalTitle}>Recovery phrase</Text>
              <MnemonicGrid words={mnemonicWords} />
              <Button title="Done" onPress={() => setPhraseModal(false)} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  marginTop: {
    marginTop: spacing.xl,
  },
  hint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toggleTextBlock: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  toggleHint: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 4,
    lineHeight: 18,
  },
  inputBlock: {
    marginBottom: spacing.md,
  },
  spinner: {
    marginTop: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
