import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import type {MainTabParamList} from '@/types/navigation';
import {HomeStack} from './HomeStack';
import {TransactionsStack} from './TransactionsStack';
import {SettingsStack} from './SettingsStack';
import {colors} from '@theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="wallet-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsStack}
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="list-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
