import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import type { SettingsStackParamList } from '@/types/navigation';
import { SettingsScreen } from '@screens/settings/SettingsScreen';
import { NetworkSelectionScreen } from '@screens/settings/NetworkSelectionScreen';
import { DisplayUnitsScreen } from '@screens/settings/DisplayUnitsScreen';
import { SecuritySettingsScreen } from '@screens/settings/SecuritySettingsScreen';
import { ChangePINScreen } from '@screens/settings/ChangePINScreen';
import { BackupExportScreen } from '@screens/settings/BackupExportScreen';
import { AboutScreen } from '@screens/settings/AboutScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="NetworkSelection" component={NetworkSelectionScreen} />
      <Stack.Screen name="DisplayUnits" component={DisplayUnitsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="ChangePIN" component={ChangePINScreen} />
      <Stack.Screen name="BackupExport" component={BackupExportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}
