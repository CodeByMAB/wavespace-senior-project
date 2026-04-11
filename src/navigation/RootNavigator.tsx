import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, type AppStateStatus } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_KEYS } from '@constants/storage';
import { useAuthContext } from '@context/AuthContext';
import { useSettings } from '@context/SettingsContext';
import { OnboardingGateProvider } from '@context/OnboardingGateContext';
import { disconnectWallet } from '@services/walletService';
import { colors } from '@theme/colors';
import UnlockScreen from '@screens/auth/UnlockScreen';
import { OnboardingStack } from './OnboardingStack';
import { MainTabNavigator } from './MainTabNavigator';

export type RootStackParamList = {
  Onboarding: undefined;
  Unlock: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const { isAuthenticated, logout } = useAuthContext();
  const { state: settings } = useSettings();
  const prevAuthRef = useRef(isAuthenticated);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const backgroundAtRef = useRef<number | null>(null);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    AsyncStorage.getItem(ASYNC_KEYS.ONBOARDING_COMPLETED)
      .then((value) => setOnboardingComplete(value === 'true'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      void AsyncStorage.getItem(ASYNC_KEYS.ONBOARDING_COMPLETED).then((value) => {
        setOnboardingComplete(value === 'true');
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      disconnectWallet();
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        const bg = backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (
          !settings.lockOnBackground &&
          bg != null &&
          settings.autoLockTimeout > 0 &&
          Date.now() - bg >= settings.autoLockTimeout * 1000
        ) {
          logout();
        }
        return;
      }

      if (next === 'background') {
        if (settings.lockOnBackground && isAuthenticatedRef.current) {
          logout();
          return;
        }
        backgroundAtRef.current = Date.now();
        return;
      }

      if (next === 'inactive' && !settings.lockOnBackground) {
        backgroundAtRef.current = Date.now();
      }
    });
    return () => sub.remove();
  }, [settings.autoLockTimeout, settings.lockOnBackground, logout]);

  const markOnboardingComplete = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <OnboardingGateProvider onMarkComplete={markOnboardingComplete}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : !isAuthenticated ? (
          <Stack.Screen name="Unlock" component={UnlockScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </OnboardingGateProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
