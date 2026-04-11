import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useSettings } from '@context/SettingsContext';
import { useAuthContext } from '@context/AuthContext';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
} from '@services/authService';
import { getWalletMetadata, storeWalletMetadata } from '@services/secureStorageService';

/**
 * Biometric unlock preference is stored in wallet metadata (`biometricEnabled`).
 * Settings UI must read/write that field and call `syncPersistedAuthState` so
 * `useAuth` exposes the correct `biometricAvailable` flag on the unlock screen.
 */
export function useBiometricLoginToggle() {
  const { state: settings, dispatch: settingsDispatch } = useSettings();
  const { syncPersistedAuthState } = useAuthContext();

  const setBiometricsEnabled = useCallback(
    (enabled: boolean) => {
      settingsDispatch({ type: 'SET_BIOMETRICS_ENABLED', payload: enabled });
    },
    [settingsDispatch],
  );

  /** Reconcile Settings UI with wallet metadata (e.g. after onboarding). */
  const syncBiometricsFromWalletMetadata = useCallback(async () => {
    const raw = await getWalletMetadata();
    let enabled = false;
    if (raw) {
      try {
        const m = JSON.parse(raw) as { biometricEnabled?: boolean };
        enabled = m.biometricEnabled === true;
      } catch {
        /* ignore */
      }
    }
    settingsDispatch({ type: 'SET_BIOMETRICS_ENABLED', payload: enabled });
  }, [settingsDispatch]);

  const onBiometricToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const available = await isBiometricAvailable();
        if (!available) {
          Alert.alert(
            'Unavailable',
            'Biometric authentication is not available on this device.',
          );
          return;
        }
        const ok = await authenticateWithBiometric();
        if (!ok) {
          Alert.alert(
            'Authentication failed',
            'Biometric verification was cancelled or failed.',
          );
          return;
        }
        try {
          const existing = await getWalletMetadata();
          const metadata = existing ? JSON.parse(existing) : {};
          metadata.biometricEnabled = true;
          await storeWalletMetadata(JSON.stringify(metadata));
          setBiometricsEnabled(true);
          await syncPersistedAuthState();
        } catch {
          Alert.alert('Error', 'Could not enable biometrics.');
        }
        return;
      }

      try {
        const existing = await getWalletMetadata();
        const metadata = existing ? JSON.parse(existing) : {};
        metadata.biometricEnabled = false;
        await storeWalletMetadata(JSON.stringify(metadata));
        setBiometricsEnabled(false);
        await syncPersistedAuthState();
      } catch {
        Alert.alert('Error', 'Could not update biometric preference.');
      }
    },
    [syncPersistedAuthState, setBiometricsEnabled],
  );

  return {
    biometricsEnabled: settings.biometricsEnabled,
    onBiometricToggle,
    syncBiometricsFromWalletMetadata,
  };
}
