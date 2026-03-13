import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

/**
 * Stub dashboard — will be replaced by the full dashboard implementation
 * in a subsequent ticket (Initialize Breez SDK / Dashboard feature).
 */
export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.title}>Wallet Ready</Text>
        <Text style={styles.subtitle}>
          Your wallet has been set up successfully. Dashboard coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  icon: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
});
