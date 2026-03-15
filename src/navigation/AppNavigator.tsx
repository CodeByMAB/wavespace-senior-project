import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SendPaymentScreen from '../screens/payments/SendPaymentScreen';
import ReceivePaymentScreen from '../screens/payments/ReceivePaymentScreen';
import PaymentHistoryScreen from '../screens/payments/PaymentHistoryScreen';

export type RootStackParamList = {
  Send: undefined;
  Receive: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Receive">
        <Stack.Screen name="Receive" component={ReceivePaymentScreen} />
        <Stack.Screen name="Send" component={SendPaymentScreen} />
        <Stack.Screen name="History" component={PaymentHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}