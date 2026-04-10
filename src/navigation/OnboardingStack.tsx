import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '@screens/onboarding/WelcomeScreen';
import CreateWalletScreen from '@screens/onboarding/CreateWalletScreen';
import MnemonicDisplayScreen from '@screens/onboarding/MnemonicDisplayScreen';
import MnemonicConfirmScreen from '@screens/onboarding/MnemonicConfirmScreen';
import RestoreWalletScreen from '@screens/onboarding/RestoreWalletScreen';
import RestoreEncryptedBackupScreen from '@screens/onboarding/RestoreEncryptedBackupScreen';
import PinSetupScreen from '@screens/onboarding/PinSetupScreen';
import BiometricSetupScreen from '@screens/onboarding/BiometricSetupScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  CreateWallet: undefined;
  MnemonicDisplay: { mnemonic: string };
  MnemonicConfirm: { mnemonic: string };
  RestoreWallet: undefined;
  RestoreEncryptedBackup: undefined;
  PinSetup: undefined;
  BiometricSetup: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0D0D0D' },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
      <Stack.Screen name="MnemonicDisplay" component={MnemonicDisplayScreen} />
      <Stack.Screen name="MnemonicConfirm" component={MnemonicConfirmScreen} />
      <Stack.Screen name="RestoreWallet" component={RestoreWalletScreen} />
      <Stack.Screen
        name="RestoreEncryptedBackup"
        component={RestoreEncryptedBackupScreen}
      />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </Stack.Navigator>
  );
}
