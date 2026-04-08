import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '@hooks/useAuth';

type AuthContextValue = ReturnType<typeof useAuthHook>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthHook();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
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
