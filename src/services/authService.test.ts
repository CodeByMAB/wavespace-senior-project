import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  authenticateWithBiometric,
  checkRateLimit,
  getRemainingLockoutMs,
  hashPin,
  isBiometricAvailable,
  normalizeLockoutAfterExpiry,
  verifyPin,
} from './authService';

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(),
  isEnrolledAsync: vi.fn(),
  authenticateAsync: vi.fn(),
}));

describe('authService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hashPin / verifyPin', () => {
    it(
      'hashPin returns a non-empty string different from the input',
      async () => {
        const hash = await hashPin('1234');
        expect(hash).toBeTruthy();
        expect(hash).not.toBe('1234');
      },
      60_000,
    );

    it(
      'verifyPin returns true for matching hash',
      async () => {
        const hash = await hashPin('1234');
        await expect(verifyPin('1234', hash)).resolves.toBe(true);
      },
      60_000,
    );

    it(
      'verifyPin returns false for wrong PIN',
      async () => {
        const hash = await hashPin('1234');
        await expect(verifyPin('9999', hash)).resolves.toBe(false);
      },
      60_000,
    );
  });

  describe('checkRateLimit', () => {
    it('returns false when failedAttempts < 3 (not locked)', () => {
      expect(checkRateLimit(2, 0)).toBe(false);
    });

    it('returns true when locked within 30s window', () => {
      expect(checkRateLimit(3, Date.now())).toBe(true);
    });

    it('returns false when lockout window has expired', () => {
      expect(checkRateLimit(3, Date.now() - 31_000)).toBe(false);
    });
  });

  describe('getRemainingLockoutMs', () => {
    it('returns 0 when not in lockout', () => {
      expect(getRemainingLockoutMs(2, 0)).toBe(0);
    });

    it('returns a positive number ≤ 30000 when locked', () => {
      const remaining = getRemainingLockoutMs(3, Date.now());
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30_000);
    });
  });

  describe('normalizeLockoutAfterExpiry', () => {
    it('resets to 0 after lockout expires', () => {
      expect(normalizeLockoutAfterExpiry(3, Date.now() - 31_000)).toEqual({
        failedAttempts: 0,
        lockoutStartMs: 0,
      });
    });

    it('leaves values unchanged when lockout still active', () => {
      const start = Date.now();
      expect(normalizeLockoutAfterExpiry(3, start)).toEqual({
        failedAttempts: 3,
        lockoutStartMs: start,
      });
    });
  });

  describe('biometrics', () => {
    beforeEach(() => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockReset();
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockReset();
      vi.mocked(LocalAuthentication.authenticateAsync).mockReset();
    });

    it('isBiometricAvailable returns mocked enrolled state when hardware exists', async () => {
      vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
      vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
      await expect(isBiometricAvailable()).resolves.toBe(true);
      expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
      expect(LocalAuthentication.isEnrolledAsync).toHaveBeenCalled();
    });

    it('authenticateWithBiometric returns true when mock succeeds', async () => {
      vi.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({
        success: true,
      } as never);
      await expect(authenticateWithBiometric()).resolves.toBe(true);
    });
  });
});
