import * as bip39 from 'bip39';

/**
 * Generates a cryptographically secure BIP39 mnemonic.
 * 12 words → 128-bit entropy; 24 words → 256-bit entropy.
 */
export function generateMnemonic(wordCount: 12 | 24): string {
  const strength = wordCount === 24 ? 256 : 128;
  return bip39.generateMnemonic(strength);
}

/**
 * Validates a mnemonic against the BIP39 wordlist and checksum.
 * Returns true only for fully valid mnemonics.
 */
export function validateMnemonic(mnemonic: string): boolean {
  const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  return bip39.validateMnemonic(normalized);
}

/**
 * Splits a mnemonic string into an ordered array of words.
 */
export function mnemonicToWords(mnemonic: string): string[] {
  return mnemonic.trim().split(/\s+/);
}
