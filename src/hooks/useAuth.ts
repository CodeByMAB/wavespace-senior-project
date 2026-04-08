import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '@services/authService';
import * as secureStorageService from '@services/secureStorageService';
import { ASYNC_KEYS } from '@constants/storage';

interface AuthState {
  isAuthenticated: boolean;
  failedAttempts: number;
  lockoutUntil: number; // unix ms when 3rd failure occurred; 0 = no active lockout anchor
  biometricAvailable: boolean;
}

interface UseAuthReturn extends AuthState {
  setupPin: (pin: string) => Promise<void>;
  authenticateWithPin: (pin: string) => Promise<boolean>;
  authenticateWithBiometric: () => Promise<boolean>;
  logout: () => void;
  isLockedOut: boolean;
  remainingLockoutMs: number;
  /** Re-read persisted lockout + biometric preference (e.g. after lockout timer or screen focus). */
  syncPersistedAuthState: () => Promise<void>;
}

type PersistedLockout = {
  failedAttempts: number;
  lockoutUntil: number;
};

function parsePersistedLockout(raw: string | null): PersistedLockout {
  if (!raw) return { failedAttempts: 0, lockoutUntil: 0 };
  try {
    const p = JSON.parse(raw) as Partial<PersistedLockout>;
    const failedAttempts =
      typeof p.failedAttempts === 'number' && Number.isFinite(p.failedAttempts)
        ? p.failedAttempts
        : 0;
    const lockoutUntil =
      typeof p.lockoutUntil === 'number' && Number.isFinite(p.lockoutUntil)
        ? p.lockoutUntil
        : 0;
    return { failedAttempts, lockoutUntil };
  } catch {
    return { failedAttempts: 0, lockoutUntil: 0 };
  }
}

async function readPersistedLockout(): Promise<PersistedLockout> {
  const raw = await AsyncStorage.getItem(ASYNC_KEYS.AUTH_LOCKOUT_METADATA);
  return parsePersistedLockout(raw);
}

async function writePersistedLockout(data: PersistedLockout): Promise<void> {
  await AsyncStorage.setItem(ASYNC_KEYS.AUTH_LOCKOUT_METADATA, JSON.stringify(data));
}

async function normalizeAndPersistLockout(
  failedAttempts: number,
  lockoutUntil: number,
): Promise<PersistedLockout> {
  const { failedAttempts: fa, lockoutStartMs } = authService.normalizeLockoutAfterExpiry(
    failedAttempts,
    lockoutUntil,
  );
  const next: PersistedLockout = { failedAttempts: fa, lockoutUntil: lockoutStartMs };
  if (fa !== failedAttempts || lockoutStartMs !== lockoutUntil) {
    await writePersistedLockout(next);
  }
  return next;
}

function parseBiometricUserEnabled(metadataJson: string | null): boolean {
  if (!metadataJson) return false;
  try {
    const m = JSON.parse(metadataJson) as { biometricEnabled?: boolean };
    return m.biometricEnabled === true;
  } catch {
    return false;
  }
}

export function useAuth(): UseAuthReturn {
  const mountedRef = useRef(true);
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    failedAttempts: 0,
    lockoutUntil: 0,
    biometricAvailable: false,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncPersistedAuthState = useCallback(async () => {
    const persisted = await readPersistedLockout();
    const normalized = await normalizeAndPersistLockout(
      persisted.failedAttempts,
      persisted.lockoutUntil,
    );
    const [hw, metaRaw] = await Promise.all([
      authService.isBiometricAvailable(),
      secureStorageService.getWalletMetadata(),
    ]);
    const userWantsBiometric = parseBiometricUserEnabled(metaRaw);
    if (!mountedRef.current) return;
    setState((prev) => ({
      ...prev,
      failedAttempts: normalized.failedAttempts,
      lockoutUntil: normalized.lockoutUntil,
      biometricAvailable: hw && userWantsBiometric,
    }));
  }, []);

  useEffect(() => {
    void syncPersistedAuthState();
  }, [syncPersistedAuthState]);

  const isLockedOut = authService.checkRateLimit(
    state.failedAttempts,
    state.lockoutUntil,
  );

  const remainingLockoutMs = authService.getRemainingLockoutMs(
    state.failedAttempts,
    state.lockoutUntil,
  );

  const setupPin = useCallback(async (pin: string): Promise<void> => {
    const hash = await authService.hashPin(pin);
    await secureStorageService.storePinHash(hash);
  }, []);

  const authenticateWithPin = useCallback(async (pin: string): Promise<boolean> => {
    let { failedAttempts, lockoutUntil } = await readPersistedLockout();
    const normalized = authService.normalizeLockoutAfterExpiry(failedAttempts, lockoutUntil);
    if (
      normalized.failedAttempts !== failedAttempts ||
      normalized.lockoutStartMs !== lockoutUntil
    ) {
      failedAttempts = normalized.failedAttempts;
      lockoutUntil = normalized.lockoutStartMs;
      await writePersistedLockout({ failedAttempts, lockoutUntil });
      setState((prev) => ({ ...prev, failedAttempts, lockoutUntil }));
    }

    if (authService.checkRateLimit(failedAttempts, lockoutUntil)) {
      setState((prev) => ({ ...prev, failedAttempts, lockoutUntil }));
      return false;
    }

    const hash = await secureStorageService.getPinHash();
    if (!hash) return false;

    const valid = await authService.verifyPin(pin, hash);

    if (valid) {
      await writePersistedLockout({ failedAttempts: 0, lockoutUntil: 0 });
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        failedAttempts: 0,
        lockoutUntil: 0,
      }));
    } else {
      const newAttempts = failedAttempts + 1;
      const newLockoutUntil = newAttempts >= 3 ? Date.now() : lockoutUntil;
      await writePersistedLockout({
        failedAttempts: newAttempts,
        lockoutUntil: newLockoutUntil,
      });
      setState((prev) => ({
        ...prev,
        failedAttempts: newAttempts,
        lockoutUntil: newLockoutUntil,
      }));
    }

    return valid;
  }, []);

  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    const success = await authService.authenticateWithBiometric();
    if (success) {
      await writePersistedLockout({ failedAttempts: 0, lockoutUntil: 0 });
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        failedAttempts: 0,
        lockoutUntil: 0,
      }));
    }
    return success;
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
  }, []);

  return {
    ...state,
    setupPin,
    authenticateWithPin,
    authenticateWithBiometric,
    logout,
    isLockedOut,
    remainingLockoutMs,
    syncPersistedAuthState,
  };
}
