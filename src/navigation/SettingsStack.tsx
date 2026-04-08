import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '@screens/settings/SettingsScreen';

export type SettingsStackParamList = {
  SettingsMain: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
