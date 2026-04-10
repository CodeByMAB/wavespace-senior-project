import {beforeEach, describe, expect, it, vi} from 'vitest';
import {SECURE_KEYS} from '@constants/storage';

const memoryStore = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => memoryStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    memoryStore.delete(key);
  },
}));

describe('secureStorageService', () => {
  beforeEach(async () => {
    memoryStore.clear();
    vi.resetModules();
  });

  it('storeMnemonic → getMnemonic round-trips the original mnemonic', async () => {
    const {storeMnemonic, getMnemonic} = await import('./secureStorageService');
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    await storeMnemonic(mnemonic);
    await expect(getMnemonic()).resolves.toBe(mnemonic);
  });

  it('getMnemonic returns null when nothing is stored', async () => {
    const {getMnemonic} = await import('./secureStorageService');
    await expect(getMnemonic()).resolves.toBeNull();
  });

  it('getMnemonic returns null when ciphertext cannot be decrypted', async () => {
    memoryStore.set(SECURE_KEYS.MNEMONIC_ENC_KEY, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    memoryStore.set(SECURE_KEYS.MNEMONIC_KEY, 'not-valid-json');
    const {getMnemonic} = await import('./secureStorageService');
    await expect(getMnemonic()).resolves.toBeNull();
  });

  it('getMnemonic returns null when payload JSON is missing nonce/ciphertext fields', async () => {
    memoryStore.set(SECURE_KEYS.MNEMONIC_ENC_KEY, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    memoryStore.set(SECURE_KEYS.MNEMONIC_KEY, '{}');
    const {getMnemonic} = await import('./secureStorageService');
    await expect(getMnemonic()).resolves.toBeNull();
  });

  it('getMnemonic returns null when nonce/ciphertext are not valid base64', async () => {
    memoryStore.set(SECURE_KEYS.MNEMONIC_ENC_KEY, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    memoryStore.set(
      SECURE_KEYS.MNEMONIC_KEY,
      JSON.stringify({nonce: '!!!not-base64!!!', ciphertext: '###'}),
    );
    const {getMnemonic} = await import('./secureStorageService');
    await expect(getMnemonic()).resolves.toBeNull();
  });

  it('getMnemonic returns null when AES-GCM authentication fails (tampered ciphertext)', async () => {
    const {storeMnemonic, getMnemonic} = await import('./secureStorageService');
    await storeMnemonic('word '.repeat(12).trim());
    const enc = memoryStore.get(SECURE_KEYS.MNEMONIC_KEY)!;
    const obj = JSON.parse(enc) as {nonce: string; ciphertext: string};
    obj.ciphertext = obj.ciphertext.slice(0, -4) + 'QQQQ';
    memoryStore.set(SECURE_KEYS.MNEMONIC_KEY, JSON.stringify(obj));
    await expect(getMnemonic()).resolves.toBeNull();
  });

  it('deleteMnemonic clears MNEMONIC_KEY and MNEMONIC_ENC_KEY', async () => {
    const {storeMnemonic, deleteMnemonic} = await import('./secureStorageService');
    await storeMnemonic('word '.repeat(12).trim());
    await deleteMnemonic();
    expect(memoryStore.has(SECURE_KEYS.MNEMONIC_KEY)).toBe(false);
    expect(memoryStore.has(SECURE_KEYS.MNEMONIC_ENC_KEY)).toBe(false);
  });

  it('hasMnemonic is false before store and true after', async () => {
    const {storeMnemonic, hasMnemonic} = await import('./secureStorageService');
    await expect(hasMnemonic()).resolves.toBe(false);
    await storeMnemonic('zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong');
    await expect(hasMnemonic()).resolves.toBe(true);
  });

  it('storePinHash → getPinHash round-trips', async () => {
    const {storePinHash, getPinHash} = await import('./secureStorageService');
    const hash = '$2a$10$abcdefghijklmnopqrstuv';
    await storePinHash(hash);
    await expect(getPinHash()).resolves.toBe(hash);
  });

  it('storePassphrase with empty string deletes the passphrase key', async () => {
    const {storePassphrase, getPassphrase} = await import('./secureStorageService');
    await storePassphrase('secret');
    await storePassphrase('');
    expect(memoryStore.has(SECURE_KEYS.PASSPHRASE_KEY)).toBe(false);
    await expect(getPassphrase()).resolves.toBeNull();
  });

  it('storePassphrase with non-empty value round-trips', async () => {
    const {storePassphrase, getPassphrase} = await import('./secureStorageService');
    await storePassphrase('my bip39 passphrase');
    await expect(getPassphrase()).resolves.toBe('my bip39 passphrase');
  });

  it('getPassphrase returns null when payload is not valid JSON', async () => {
    memoryStore.set(SECURE_KEYS.MNEMONIC_ENC_KEY, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    memoryStore.set(SECURE_KEYS.PASSPHRASE_KEY, '{broken');
    const {getPassphrase} = await import('./secureStorageService');
    await expect(getPassphrase()).resolves.toBeNull();
  });

  it('getPassphrase returns null when AES-GCM authentication fails (tampered ciphertext)', async () => {
    const {storePassphrase, getPassphrase} = await import('./secureStorageService');
    await storePassphrase('secret phrase');
    const enc = memoryStore.get(SECURE_KEYS.PASSPHRASE_KEY)!;
    const obj = JSON.parse(enc) as {nonce: string; ciphertext: string};
    obj.ciphertext = obj.ciphertext.slice(0, -4) + 'QQQQ';
    memoryStore.set(SECURE_KEYS.PASSPHRASE_KEY, JSON.stringify(obj));
    await expect(getPassphrase()).resolves.toBeNull();
  });

  it('storeWalletMetadata → getWalletMetadata round-trips', async () => {
    const {storeWalletMetadata, getWalletMetadata} = await import('./secureStorageService');
    const meta = JSON.stringify({version: 1, label: 'test'});
    await storeWalletMetadata(meta);
    await expect(getWalletMetadata()).resolves.toBe(meta);
  });

  it('getPinHash returns null when no hash is stored', async () => {
    const {getPinHash} = await import('./secureStorageService');
    await expect(getPinHash()).resolves.toBeNull();
  });

  it('getWalletMetadata returns null when no metadata is stored', async () => {
    const {getWalletMetadata} = await import('./secureStorageService');
    await expect(getWalletMetadata()).resolves.toBeNull();
  });
});
