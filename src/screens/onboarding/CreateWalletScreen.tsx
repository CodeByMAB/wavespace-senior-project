import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {GradientBackground} from '@components/common/GradientBackground';
import {Header} from '@components/common/Header';
import {Button} from '@components/common/Button';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';
import {OnboardingStackParamList} from '@navigation/OnboardingStack';
import {generateMnemonic} from '@services/mnemonicService';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'CreateWallet'>;
type WordCount = 12 | 24;

export default function CreateWalletScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [wordCount, setWordCount] = useState<WordCount>(12);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const mnemonic = generateMnemonic(wordCount);
      navigation.navigate('MnemonicDisplay', {mnemonic});
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GradientBackground glow>
      <Header title="" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xxl},
        ]}>
        <View style={styles.heroSection}>
          <View style={styles.iconBox}>
            <Ionicons name="key-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headline}>Create{'\n'}new wallet</Text>
          <Text style={styles.subtitle}>
            Choose how many words your recovery phrase will contain. More words
            means stronger security.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Recovery Phrase Length</Text>
        <View style={styles.toggle}>
          {([12, 24] as WordCount[]).map(count => (
            <TouchableOpacity
              key={count}
              style={[
                styles.toggleOption,
                wordCount === count && styles.toggleSelected,
              ]}
              onPress={() => setWordCount(count)}
              accessibilityRole="radio"
              accessibilityState={{checked: wordCount === count}}>
              <Text
                style={[
                  styles.toggleText,
                  wordCount === count && styles.toggleTextSelected,
                ]}>
                {count} words
              </Text>
              <Text
                style={[
                  styles.toggleSubtext,
                  wordCount === count && styles.toggleSubtextSelected,
                ]}>
                {count === 12 ? '128-bit entropy' : '256-bit entropy'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Before you continue</Text>
          <Text style={styles.infoText}>
            Your recovery phrase is the only way to restore your wallet. Write it
            down on paper and store it somewhere safe. Never share it with anyone.
          </Text>
        </View>

        <Button
          title="Generate Wallet"
          onPress={handleGenerate}
          loading={isGenerating}
          disabled={isGenerating}
          style={styles.btn}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  heroSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  toggle: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleOption: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  toggleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  toggleTextSelected: {
    color: colors.primary,
  },
  toggleSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  toggleSubtextSelected: {
    color: colors.primary,
    opacity: 0.6,
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  infoText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  btn: {
    borderRadius: 50,
  },
});
