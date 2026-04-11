import React, { createContext, useContext, useMemo } from 'react';
import { useAuth as useAuthHook } from '@hooks/useAuth';

type AuthContextValue = ReturnType<typeof useAuthHook>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthHook();
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: auth.isAuthenticated,
      failedAttempts: auth.failedAttempts,
      lockoutUntil: auth.lockoutUntil,
      biometricAvailable: auth.biometricAvailable,
      setupPin: auth.setupPin,
      authenticateWithPin: auth.authenticateWithPin,
      authenticateWithBiometric: auth.authenticateWithBiometric,
      logout: auth.logout,
      isLockedOut: auth.isLockedOut,
      remainingLockoutMs: auth.remainingLockoutMs,
      syncPersistedAuthState: auth.syncPersistedAuthState,
    }),
    [
      auth.isAuthenticated,
      auth.failedAttempts,
      auth.lockoutUntil,
      auth.biometricAvailable,
      auth.setupPin,
      auth.authenticateWithPin,
      auth.authenticateWithBiometric,
      auth.logout,
      auth.isLockedOut,
      auth.remainingLockoutMs,
      auth.syncPersistedAuthState,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}

/**
 * Alias for UI screens that expect the old wave_space_app auth API shape.
 * Provides a no-op dispatch and a state shim alongside the real auth methods.
 */
export function useAuth() {
  const ctx = useAuthContext();
  return {
    ...ctx,
    dispatch: (_action: unknown) => {},
    state: { isAuthenticated: ctx.isAuthenticated },
  };
}
