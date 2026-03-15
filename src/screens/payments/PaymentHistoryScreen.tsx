import React, { useCallback, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import paymentService from '../../services/payment/PaymentService';
import { PaymentRecord } from '../../types/payment';

export default function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const loadPayments = useCallback(async () => {
    try {
      const result = await paymentService.listPayments();
      setPayments(result);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to load payments.');
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment History</Text>
      <Button title="Refresh Payments" onPress={loadPayments} />

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.direction}>{item.direction.toUpperCase()}</Text>
            <Text>{item.amountSat} sats</Text>
            <Text>{item.description || 'No description'}</Text>
            <Text>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No payments loaded yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 12,
    gap: 4,
  },
  direction: {
    fontWeight: '700',
  },
  empty: {
    marginTop: 20,
    textAlign: 'center',
  },
});