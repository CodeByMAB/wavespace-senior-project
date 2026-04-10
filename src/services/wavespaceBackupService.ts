import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha256.js';
import { validateMnemonic } from '@services/mnemonicService';

/** Must match `BackupExportScreen` export format. */
export const WAVE_BACKUP_VERSION = 2;

export class WaveBackupDecryptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaveBackupDecryptError';
  }
}
const PBKDF_ITERATIONS = 100_000;
const DK_LEN_BYTES = 32;

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
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

function decryptUtf8AesGcm(
  key: Uint8Array,
  nonceB64: string,
  ciphertextB64: string,
): string {
  const nonce = base64ToBytes(nonceB64);
  const ciphertext = base64ToBytes(ciphertextB64);
  const cipher = gcm(key, nonce);
  const plaintext = cipher.decrypt(ciphertext);
  return new TextDecoder().decode(plaintext);
}

type BackupKdf = {
  name?: string;
  prf?: string;
  iterations?: number;
  salt_b64?: string;
  dk_len_bytes?: number;
};

type WaveBackupFileV2 = {
  version?: number;
  kdf?: BackupKdf;
  encrypted_payload_b64?: string;
  nonce?: string;
  checksum?: string;
  pbkdf2_iterations?: number;
};

type InnerPayload = {
  mnemonic?: string;
};

/**
 * Decrypts a WaveSpace encrypted backup JSON (same format as Backup / Export).
 * Verifies checksum and BIP39 mnemonic.
 */
export async function decryptWaveSpaceBackup(
  jsonText: string,
  password: string,
): Promise<{ mnemonic: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText.trim());
  } catch {
    throw new WaveBackupDecryptError('This does not look like valid backup JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new WaveBackupDecryptError('Invalid backup file structure.');
  }

  const file = parsed as WaveBackupFileV2;
  if (file.version !== WAVE_BACKUP_VERSION) {
    throw new WaveBackupDecryptError(
      'Unsupported backup version. Export a new backup from WaveSpace.',
    );
  }

  const kdf = file.kdf;
  if (
    !kdf?.salt_b64 ||
    kdf.iterations !== PBKDF_ITERATIONS ||
    (file.pbkdf2_iterations != null &&
      file.pbkdf2_iterations !== PBKDF_ITERATIONS)
  ) {
    throw new WaveBackupDecryptError(
      'Invalid or unsupported key derivation parameters.',
    );
  }

  if (!file.encrypted_payload_b64 || !file.nonce || !file.checksum) {
    throw new WaveBackupDecryptError('Backup file is missing encrypted data.');
  }

  if (!password) {
    throw new WaveBackupDecryptError(
      'Enter the password you used when exporting this backup.',
    );
  }

  let key: Uint8Array;
  try {
    const salt = base64ToBytes(kdf.salt_b64);
    key = await deriveKeyFromPassword(password, salt);
  } catch {
    throw new WaveBackupDecryptError('Could not read backup key material.');
  }

  let plaintext: string;
  try {
    plaintext = decryptUtf8AesGcm(
      key,
      file.nonce,
      file.encrypted_payload_b64,
    );
  } catch {
    throw new WaveBackupDecryptError('Wrong password or corrupted backup file.');
  }

  let inner: InnerPayload;
  try {
    inner = JSON.parse(plaintext) as InnerPayload;
  } catch {
    throw new WaveBackupDecryptError('Decrypted backup payload is not valid.');
  }

  const mnemonic = inner.mnemonic?.trim() ?? '';
  if (!mnemonic) {
    throw new WaveBackupDecryptError('Backup did not contain a recovery phrase.');
  }

  const checksum = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    mnemonic,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  if (checksum !== file.checksum) {
    throw new WaveBackupDecryptError(
      'Backup checksum did not match. File may be damaged.',
    );
  }

  if (!validateMnemonic(mnemonic)) {
    throw new WaveBackupDecryptError(
      'Recovery phrase inside backup is not valid.',
    );
  }

  return { mnemonic };
}
