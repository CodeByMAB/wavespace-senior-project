import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import paymentService from '../../services/payment/PaymentService';

export default function SendPaymentScreen() {
  const [bolt11, setBolt11] = useState('');
  const [decoded, setDecoded] = useState<any>(null);

  const handleDecode = async () => {
    try {
      const result = await paymentService.decodeInvoice(bolt11);
      setDecoded(result);
    } catch (error: any) {
      Alert.alert('Decode Error', error.message ?? 'Failed to decode invoice.');
    }
  };

  const handleSend = async () => {
    try {
      await paymentService.sendPayment({ bolt11 });
      Alert.alert('Success', 'Payment sent successfully.');
    } catch (error: any) {
      Alert.alert('Send Error', error.message ?? 'Failed to send payment.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Send Payment</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste Bolt11 invoice"
        value={bolt11}
        onChangeText={setBolt11}
        multiline
      />

      <Button title="Decode Invoice" onPress={handleDecode} />

      {decoded ? (
        <View style={styles.resultBox}>
          <Text>Description: {decoded.description || 'None'}</Text>
          <Text>Amount (sats): {decoded.amountSat ?? 'Unknown'}</Text>
          <Text>Expires: {decoded.expiresAt ?? 'Unknown'}</Text>
        </View>
      ) : null}

      <Button title="Send Payment" onPress={handleSend} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  resultBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    gap: 8,
  },
});