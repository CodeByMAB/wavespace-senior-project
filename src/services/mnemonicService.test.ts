import {describe, expect, it} from 'vitest';
import {
  generateMnemonic,
  mnemonicToWords,
  validateMnemonic,
} from './mnemonicService';

/** Known valid BIP39 mnemonic (test vector). */
const VALID_12 =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('mnemonicService', () => {
  describe('generateMnemonic', () => {
    it('returns a 12-word string for wordCount 12', () => {
      const m = generateMnemonic(12);
      expect(m.split(' ').length).toBe(12);
    });

    it('returns a 24-word string for wordCount 24', () => {
      const m = generateMnemonic(24);
      expect(m.split(' ').length).toBe(24);
    });
  });

  describe('validateMnemonic', () => {
    it('returns true for a known valid 12-word mnemonic', () => {
      expect(validateMnemonic(VALID_12)).toBe(true);
    });

    it('returns false for a garbage string', () => {
      expect(validateMnemonic('not a real mnemonic phrase at all')).toBe(false);
    });

    it('normalizes extra whitespace and mixed case', () => {
      const spaced = `  ${VALID_12.toUpperCase().split(' ').join('   ')}  `;
      expect(validateMnemonic(spaced)).toBe(true);
    });
  });

  describe('mnemonicToWords', () => {
    it('splits on single spaces', () => {
      expect(mnemonicToWords('one two three')).toEqual(['one', 'two', 'three']);
    });

    it('splits on multiple spaces', () => {
      expect(mnemonicToWords('one   two    three')).toEqual(['one', 'two', 'three']);
    });
  });
});
