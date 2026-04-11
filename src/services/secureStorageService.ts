import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { SECURE_KEYS } from '@constants/storage';

// --- Base64 helpers (no Buffer/Node dependency) ---

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- Device-protected AES-256 key management ---
// V2 stores the AES key without OS biometric prompts so "Biometric Login" off + app PIN
// does not trigger Face ID when opening the wallet. Access still requires an unlocked device
// (iOS keychain accessibility). Legacy V1 used requireAuthentication: true (one-time migrate).

/** iOS: limit key access to while device is unlocked; Android ignores `keychainAccessible`. */
const ENC_KEY_V2_OPTIONS: SecureStore.SecureStoreOptions = {
  requireAuthentication: false,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function getOrCreateEncryptionKey(): Promise<Uint8Array> {
  const v2 = await SecureStore.getItemAsync(SECURE_KEYS.MNEMONIC_ENC_KEY_V2, ENC_KEY_V2_OPTIONS);
  if (v2) {
    return base64ToBytes(v2);
  }

  const legacy = await SecureStore.getItemAsync(SECURE_KEYS.MNEMONIC_ENC_KEY, {
    requireAuthentication: true,
    authenticationPrompt: 'Update wallet security',
  });
  if (legacy) {
    const key = base64ToBytes(legacy);
    await SecureStore.setItemAsync(
      SECURE_KEYS.MNEMONIC_ENC_KEY_V2,
      bytesToBase64(key),
      ENC_KEY_V2_OPTIONS,
    );
    await SecureStore.deleteItemAsync(SECURE_KEYS.MNEMONIC_ENC_KEY);
    return key;
  }

  const key = randomBytes(32);
  await SecureStore.setItemAsync(
    SECURE_KEYS.MNEMONIC_ENC_KEY_V2,
    bytesToBase64(key),
    ENC_KEY_V2_OPTIONS,
  );
  return key;
}

// --- AES-256-GCM encrypt / decrypt ---

function encryptAesGcm(key: Uint8Array, plaintext: string): string {
  const nonce = randomBytes(12); // 96-bit nonce; unique per encryption
  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(new TextEncoder().encode(plaintext));
  return JSON.stringify({
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ciphertext),
  });
}

function decryptAesGcm(key: Uint8Array, payload: string): string {
  const { nonce, ciphertext } = JSON.parse(payload) as {
    nonce: string;
    ciphertext: string;
  };
  const cipher = gcm(key, base64ToBytes(nonce));
  const plaintext = cipher.decrypt(base64ToBytes(ciphertext));
  return new TextDecoder().decode(plaintext);
}

// --- Mnemonic ---

/**
 * Encrypts the mnemonic with AES-256-GCM using a device-protected key and
 * persists the ciphertext blob. The encryption key uses V2 storage (no OS
 * biometric prompt on read); the app PIN / optional biometric login gate access.
 */
export async function storeMnemonic(mnemonic: string): Promise<void> {
  const key = await getOrCreateEncryptionKey();
  const encrypted = encryptAesGcm(key, mnemonic);
  await SecureStore.setItemAsync(SECURE_KEYS.MNEMONIC_KEY, encrypted);
}

/**
 * Retrieves and decrypts the mnemonic. Returns null if no mnemonic is stored
 * or decryption fails.
 */
export async function getMnemonic(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(SECURE_KEYS.MNEMONIC_KEY);
  if (!stored) return null;
  try {
    const key = await getOrCreateEncryptionKey();
    return decryptAesGcm(key, stored);
  } catch {
    return null;
  }
}

/**
 * Deletes the stored mnemonic ciphertext and its encryption key. Call only on
 * wallet reset.
 */
export async function deleteMnemonic(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEYS.MNEMONIC_KEY);
  await SecureStore.deleteItemAsync(SECURE_KEYS.MNEMONIC_ENC_KEY);
  await SecureStore.deleteItemAsync(SECURE_KEYS.MNEMONIC_ENC_KEY_V2);
}

/**
 * Returns true if a mnemonic ciphertext blob has been persisted (wallet
 * exists). Does not require authentication — the blob is unreadable without
 * the device-protected encryption key.
 */
export async function hasMnemonic(): Promise<boolean> {
  const result = await SecureStore.getItemAsync(SECURE_KEYS.MNEMONIC_KEY);
  return result !== null;
}

// --- BIP39 Passphrase ---

/**
 * Encrypts the BIP39 passphrase with AES-256-GCM and persists it using the
 * same device-protected key as the mnemonic. Pass an empty string to clear.
 */
export async function storePassphrase(passphrase: string): Promise<void> {
  if (!passphrase) {
    await SecureStore.deleteItemAsync(SECURE_KEYS.PASSPHRASE_KEY);
    return;
  }
  const key = await getOrCreateEncryptionKey();
  const encrypted = encryptAesGcm(key, passphrase);
  await SecureStore.setItemAsync(SECURE_KEYS.PASSPHRASE_KEY, encrypted);
}

/**
 * Retrieves and decrypts the stored BIP39 passphrase. Returns null if no
 * passphrase was stored (wallet uses empty passphrase).
 */
export async function getPassphrase(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(SECURE_KEYS.PASSPHRASE_KEY);
  if (!stored) return null;
  try {
    const key = await getOrCreateEncryptionKey();
    return decryptAesGcm(key, stored);
  } catch {
    return null;
  }
}

// --- PIN hash ---

/**
 * Stores the bcrypt PIN hash.
 */
export async function storePinHash(hash: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.PIN_HASH_KEY, hash);
}

/**
 * Retrieves the stored bcrypt PIN hash, or null if not set.
 */
export async function getPinHash(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.PIN_HASH_KEY);
}

// --- Wallet metadata ---

/**
 * Stores arbitrary wallet metadata JSON string.
 */
export async function storeWalletMetadata(metadata: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.WALLET_METADATA_KEY, metadata);
}

/**
 * Retrieves wallet metadata JSON string, or null if not set.
 */
export async function getWalletMetadata(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.WALLET_METADATA_KEY);
}
