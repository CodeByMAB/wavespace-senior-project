import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import paymentService from '../../services/payment/PaymentService';

export default function ReceivePaymentScreen() {
  const [amountSat, setAmountSat] = useState('');
  const [description, setDescription] = useState('');
  const [invoice, setInvoice] = useState('');

  const handleCreateInvoice = async () => {
    try {
      const result = await paymentService.createInvoice({
        amountSat: amountSat ? Number(amountSat) : undefined,
        description,
      });

      setInvoice(result.bolt11);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to create invoice.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Receive Payment</Text>

      <TextInput
        style={styles.input}
        placeholder="Amount in sats (optional)"
        keyboardType="numeric"
        value={amountSat}
        onChangeText={setAmountSat}
      />

      <TextInput
        style={styles.input}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />

      <Button title="Create Invoice" onPress={handleCreateInvoice} />

      {invoice ? (
        <View style={styles.resultBox}>
          <Text style={styles.label}>Bolt11 Invoice</Text>
          <Text selectable>{invoice}</Text>
        </View>
      ) : null}
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
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  label: {
    fontWeight: '700',
    marginBottom: 8,
  },
});