import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_KEYS } from '../constants/storage';
import { useAuthContext } from '../context/AuthContext';

import WelcomeScreen from '../screens/WelcomeScreen';
import CreateWalletScreen from '../screens/CreateWalletScreen';
import MnemonicDisplayScreen from '../screens/MnemonicDisplayScreen';
import MnemonicConfirmScreen from '../screens/MnemonicConfirmScreen';
import RestoreWalletScreen from '../screens/RestoreWalletScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import BiometricSetupScreen from '../screens/BiometricSetupScreen';
import UnlockScreen from '../screens/UnlockScreen';
import DashboardScreen from '../screens/DashboardScreen';

export type RootStackParamList = {
  Welcome: undefined;
  CreateWallet: undefined;
  MnemonicDisplay: { mnemonic: string };
  MnemonicConfirm: { mnemonic: string };
  RestoreWallet: undefined;
  PinSetup: undefined;
  BiometricSetup: undefined;
  Unlock: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    AsyncStorage.getItem(ASYNC_KEYS.ONBOARDING_COMPLETED)
      .then((value) => setOnboardingComplete(value === 'true'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F7931A" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
        animation: 'slide_from_right',
      }}
    >
      {!onboardingComplete ? (
        // Onboarding flow — PIN/biometric not yet configured
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
          <Stack.Screen name="MnemonicDisplay" component={MnemonicDisplayScreen} />
          <Stack.Screen name="MnemonicConfirm" component={MnemonicConfirmScreen} />
          <Stack.Screen name="RestoreWallet" component={RestoreWalletScreen} />
          <Stack.Screen name="PinSetup" component={PinSetupScreen} />
          <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </>
      ) : !isAuthenticated ? (
        // Auth gate — require PIN/biometric before Dashboard
        <Stack.Screen name="Unlock" component={UnlockScreen} />
      ) : (
        // Authenticated
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
