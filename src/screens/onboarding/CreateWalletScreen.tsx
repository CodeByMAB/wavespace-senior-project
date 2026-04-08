import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@navigation/OnboardingStack';
import { generateMnemonic } from '@services/mnemonicService';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'CreateWallet'>;
type WordCount = 12 | 24;

export default function CreateWalletScreen({ navigation }: Props) {
  const [wordCount, setWordCount] = useState<WordCount>(12);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const mnemonic = generateMnemonic(wordCount);
      navigation.navigate('MnemonicDisplay', { mnemonic });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create New Wallet</Text>
          <Text style={styles.subtitle}>
            Choose how many words your recovery phrase will contain. More words means
            stronger security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recovery Phrase Length</Text>
          <View style={styles.toggle}>
            {([12, 24] as WordCount[]).map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.toggleOption, wordCount === count && styles.toggleSelected]}
                onPress={() => setWordCount(count)}
                accessibilityRole="radio"
                accessibilityState={{ checked: wordCount === count }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    wordCount === count && styles.toggleTextSelected,
                  ]}
                >
                  {count} words
                </Text>
                <Text
                  style={[
                    styles.toggleSubtext,
                    wordCount === count && styles.toggleSubtextSelected,
                  ]}
                >
                  {count === 12 ? '128-bit entropy' : '256-bit entropy'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Before you continue</Text>
          <Text style={styles.infoText}>
            Your recovery phrase is the only way to restore your wallet. Write it down on
            paper and store it somewhere safe. Never share it with anyone.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Generate wallet"
        >
          {isGenerating ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Wallet</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 16, gap: 24 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { color: '#F7931A', fontSize: 16 },
  header: { gap: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 15, color: '#888', lineHeight: 22 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 13, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  toggle: { flexDirection: 'row', gap: 12 },
  toggleOption: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 4,
  },
  toggleSelected: { borderColor: '#F7931A', backgroundColor: '#1F1500' },
  toggleText: { fontSize: 16, fontWeight: '600', color: '#888' },
  toggleTextSelected: { color: '#F7931A' },
  toggleSubtext: { fontSize: 12, color: '#555' },
  toggleSubtextSelected: { color: '#F7931A99' },
  infoBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#F7931A' },
  infoText: { fontSize: 14, color: '#888', lineHeight: 20 },
  generateButton: {
    marginTop: 'auto',
    backgroundColor: '#F7931A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
