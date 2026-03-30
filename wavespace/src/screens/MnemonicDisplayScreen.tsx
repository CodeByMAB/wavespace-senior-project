import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ScreenCapture from 'expo-screen-capture';
import { RootStackParamList } from '../navigation/RootNavigator';
import { mnemonicToWords } from '../services/mnemonicService';

type Props = NativeStackScreenProps<RootStackParamList, 'MnemonicDisplay'>;

export default function MnemonicDisplayScreen({ navigation, route }: Props) {
  const { mnemonic } = route.params;
  const words = mnemonicToWords(mnemonic);
  const [confirmed, setConfirmed] = useState(false);

  // Prevent screenshots while mnemonic is displayed
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  const columns = words.length === 24 ? 3 : 3;
  const rows: string[][] = [];
  for (let i = 0; i < words.length; i += columns) {
    rows.push(words.slice(i, i + columns));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your Recovery Phrase</Text>
        <Text style={styles.subtitle}>
          Write these {words.length} words down in order and store them safely. This is
          the only way to recover your wallet.
        </Text>

        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>🔒 Screenshot prevention active</Text>
        </View>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((word, colIdx) => {
                const index = rowIdx * columns + colIdx + 1;
                return (
                  <View key={index} style={styles.wordCard}>
                    <Text style={styles.wordIndex}>{index}</Text>
                    <Text style={styles.wordText}>{word}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setConfirmed((c) => !c)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have written down my seed phrase in the correct order
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, !confirmed && styles.continueButtonDisabled]}
          onPress={() => navigation.navigate('MnemonicConfirm', { mnemonic })}
          disabled={!confirmed}
          accessibilityRole="button"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 16, gap: 16 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: '#F7931A', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', lineHeight: 20 },
  warningBadge: {
    backgroundColor: '#1A1A00',
    borderWidth: 1,
    borderColor: '#F7931A44',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  warningText: { color: '#F7931A', fontSize: 12, fontWeight: '600' },
  grid: { paddingVertical: 8, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  wordCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordIndex: { fontSize: 11, color: '#555', width: 18, textAlign: 'right' },
  wordText: { fontSize: 14, color: '#FFF', fontWeight: '500', flex: 1 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#F7931A', borderColor: '#F7931A' },
  checkmark: { color: '#000', fontSize: 13, fontWeight: '700' },
  checkboxLabel: { flex: 1, color: '#CCC', fontSize: 14, lineHeight: 20 },
  continueButton: {
    backgroundColor: '#F7931A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: { opacity: 0.3 },
  continueButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
