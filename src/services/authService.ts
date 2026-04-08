import * as LocalAuthentication from 'expo-local-authentication';
import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30_000;

/**
 * Hashes a PIN string using bcrypt with 12 salt rounds.
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(pin, salt);
}

/**
 * Compares a plain-text PIN against a stored bcrypt hash.
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Returns true if the device has biometric hardware and enrolled credentials.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

/**
 * Triggers the OS biometric prompt. Returns true on success.
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your wallet',
    fallbackLabel: 'Use PIN',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}

/**
 * If the user has reached MAX_FAILED_ATTEMPTS, a lockout window of
 * LOCKOUT_DURATION_MS applies from lockoutStartMs. Once that window has
 * elapsed, counters reset to a fresh 3-attempt window.
 */
export function normalizeLockoutAfterExpiry(
  failedAttempts: number,
  lockoutStartMs: number,
): { failedAttempts: number; lockoutStartMs: number } {
  if (failedAttempts < MAX_FAILED_ATTEMPTS) {
    return { failedAttempts, lockoutStartMs };
  }
  if (Date.now() - lockoutStartMs >= LOCKOUT_DURATION_MS) {
    return { failedAttempts: 0, lockoutStartMs: 0 };
  }
  return { failedAttempts, lockoutStartMs };
}

/**
 * Enforces the 3-attempt / 30-second lockout rule (FR-WM-003).
 * Returns true when the user is currently rate-limited.
 * `lockoutStartMs` is the timestamp (ms) when the third failure occurred; 0 if none.
 */
export function checkRateLimit(
  failedAttempts: number,
  lockoutStartMs: number,
): boolean {
  if (failedAttempts < MAX_FAILED_ATTEMPTS) return false;
  return Date.now() - lockoutStartMs < LOCKOUT_DURATION_MS;
}

/**
 * Returns the remaining lockout duration in milliseconds (0 if not locked).
 */
export function getRemainingLockoutMs(
  failedAttempts: number,
  lockoutStartMs: number,
): number {
  if (failedAttempts < MAX_FAILED_ATTEMPTS) return 0;
  const remaining = LOCKOUT_DURATION_MS - (Date.now() - lockoutStartMs);
  return Math.max(0, remaining);
}
