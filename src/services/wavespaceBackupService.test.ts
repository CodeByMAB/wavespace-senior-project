import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import {
  decryptWaveSpaceBackup,
  WaveBackupDecryptError,
  WAVE_BACKUP_VERSION,
} from './wavespaceBackupService';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { HEX: 'HEX' },
  digestStringAsync: async (
    _alg: string,
    data: string,
    opts: { encoding: string },
  ) => {
    if (opts.encoding === 'HEX') {
      return createHash('sha256').update(data, 'utf8').digest('hex');
    }
    throw new Error('unsupported encoding');
  },
}));

const PBKDF_ITERATIONS = 100_000;
const DK_LEN_BYTES = 32;

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

async function buildV2BackupFile(mnemonic: string, password: string) {
  const salt = randomBytes(16);
  const passwordBytes = new TextEncoder().encode(password);
  const key = await pbkdf2Async(sha256, passwordBytes, salt, {
    c: PBKDF_ITERATIONS,
    dkLen: DK_LEN_BYTES,
  });

  const plaintext = JSON.stringify({ mnemonic: mnemonic.trim() });
  const nonce = randomBytes(12);
  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(new TextEncoder().encode(plaintext));

  const checksum = createHash('sha256')
    .update(mnemonic.trim(), 'utf8')
    .digest('hex');

  return JSON.stringify({
    version: WAVE_BACKUP_VERSION,
    network: 'mainnet',
    kdf: {
      name: 'PBKDF2-HMAC-SHA256',
      prf: 'HMAC-SHA256',
      iterations: PBKDF_ITERATIONS,
      salt_b64: bytesToBase64(salt),
      dk_len_bytes: DK_LEN_BYTES,
    },
    cipher: 'AES-256-GCM',
    encrypted_payload_b64: bytesToBase64(ciphertext),
    nonce: bytesToBase64(nonce),
    checksum,
    includes_transaction_history: false,
    pbkdf2_iterations: PBKDF_ITERATIONS,
    created_at: new Date().toISOString(),
  });
}

describe('wavespaceBackupService', () => {
  it('decrypts a v2 backup matching export layout', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const password = 'test-password-8chars';
    const json = await buildV2BackupFile(mnemonic, password);

    await expect(decryptWaveSpaceBackup(json, password)).resolves.toEqual({
      mnemonic,
    });
  });

  it('rejects wrong password', async () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const json = await buildV2BackupFile(mnemonic, 'correct-pass-phrase');

    await expect(decryptWaveSpaceBackup(json, 'wrong-pass-phrase')).rejects.toThrow(
      WaveBackupDecryptError,
    );
  });
});
