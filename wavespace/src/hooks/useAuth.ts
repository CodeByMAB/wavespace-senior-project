import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';
import * as secureStorageService from '../services/secureStorageService';
import { ASYNC_KEYS } from '../constants/storage';

interface AuthState {
  isAuthenticated: boolean;
  failedAttempts: number;
  lockoutUntil: number; // unix timestamp ms; 0 = not locked
  biometricAvailable: boolean;
}

interface UseAuthReturn extends AuthState {
  setupPin: (pin: string) => Promise<void>;
  authenticateWithPin: (pin: string) => Promise<boolean>;
  authenticateWithBiometric: () => Promise<boolean>;
  logout: () => void;
  isLockedOut: boolean;
  remainingLockoutMs: number;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    failedAttempts: 0,
    lockoutUntil: 0,
    biometricAvailable: false,
  });

  useEffect(() => {
    authService.isBiometricAvailable().then((available) => {
      setState((prev) => ({ ...prev, biometricAvailable: available }));
    });
  }, []);

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

  const authenticateWithPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (authService.checkRateLimit(state.failedAttempts, state.lockoutUntil)) {
        return false;
      }

      const hash = await secureStorageService.getPinHash();
      if (!hash) return false;

      const valid = await authService.verifyPin(pin, hash);

      if (valid) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          failedAttempts: 0,
          lockoutUntil: 0,
        }));
      } else {
        const newAttempts = state.failedAttempts + 1;
        setState((prev) => ({
          ...prev,
          failedAttempts: newAttempts,
          lockoutUntil:
            newAttempts >= 3 ? Date.now() : prev.lockoutUntil,
        }));
      }

      return valid;
    },
    [state.failedAttempts, state.lockoutUntil],
  );

  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    const success = await authService.authenticateWithBiometric();
    if (success) {
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
  };
}
