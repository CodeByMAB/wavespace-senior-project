/**
 * Mnemonic management — generation, validation, secure storage, and retrieval.
 *
 * The mnemonic is the root secret. It is stored in expo-secure-store
 * (Keychain on iOS, EncryptedSharedPreferences on Android) and never
 * leaves the device.
 */

import * as SecureStore from 'expo-secure-store';
import {generateMnemonic as bip39Generate, validateMnemonic} from 'bip39';

const MNEMONIC_KEY = 'wavespace_mnemonic';
const WALLET_CREATED_KEY = 'wavespace_wallet_created';

/**
 * Generate a new 12-word BIP39 mnemonic phrase.
 */
export function generateMnemonic(): string {
  // 128 bits of entropy → 12 words
  return bip39Generate(128);
}

/**
 * Validate that a mnemonic phrase is a valid BIP39 mnemonic.
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic);
}

/**
 * Store a mnemonic phrase securely on-device.
 */
export async function storeMnemonic(mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync(MNEMONIC_KEY, mnemonic, {
    requireAuthentication: false,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(WALLET_CREATED_KEY, 'true');
}

/**
 * Retrieve the stored mnemonic. Returns null when no wallet has been created.
 */
export async function getMnemonic(): Promise<string | null> {
  return SecureStore.getItemAsync(MNEMONIC_KEY);
}

/**
 * Check whether a wallet has been created (mnemonic stored) previously.
 */
export async function hasWallet(): Promise<boolean> {
  const flag = await SecureStore.getItemAsync(WALLET_CREATED_KEY);
  return flag === 'true';
}

/**
 * Erase the stored mnemonic and wallet flag. Use with extreme caution —
 * if the user hasn't backed up the mnemonic, funds are lost forever.
 */
export async function deleteMnemonic(): Promise<void> {
  await SecureStore.deleteItemAsync(MNEMONIC_KEY);
  await SecureStore.deleteItemAsync(WALLET_CREATED_KEY);
}
