import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {GradientBackground} from '@components/common/GradientBackground';
import {Button} from '@components/common/Button';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';
import type {OnboardingStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const CYCLING_WORDS = ['Send', 'Stack', 'Spend', 'Save'];
const CYCLE_DURATION = 2500;

function CyclingText() {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnims = useRef(CYCLING_WORDS.map(() => new Animated.Value(0.15))).current;

  useEffect(() => {
    // Fade in the first word
    Animated.timing(fadeAnims[0], {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const current = prev;
        const next = (prev + 1) % CYCLING_WORDS.length;

        // Fade out current
        Animated.timing(fadeAnims[current], {
          toValue: 0.15,
          duration: 400,
          useNativeDriver: true,
        }).start();

        // Fade in next
        Animated.timing(fadeAnims[next], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        return next;
      });
    }, CYCLE_DURATION);

    return () => clearInterval(interval);
  }, [fadeAnims]);

  return (
    <View style={styles.cyclingContainer}>
      {CYCLING_WORDS.map((word, index) => (
        <Animated.Text
          key={word}
          style={[
            styles.cyclingWord,
            {opacity: fadeAnims[index]},
          ]}>
          {word}
        </Animated.Text>
      ))}
    </View>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground glow>
      <View style={[styles.container, {paddingTop: insets.top}]}>
        {/* Top cycling words section */}
        <View style={styles.topSection}>
          <CyclingText />
        </View>

        {/* Bottom content card area */}
        <View style={[styles.bottomSection, {paddingBottom: insets.bottom + spacing.xxl}]}>
          <View style={styles.iconBox}>
            <Ionicons name="flash" size={28} color={colors.primary} />
          </View>

          <Text style={styles.headline}>
            Your bitcoin,{'\n'}your way
          </Text>

          <Text style={styles.subtitle}>
            Self-custodial Lightning wallet{'\n'}for instant Bitcoin payments.
          </Text>

          <View style={styles.buttons}>
            <Button
              title="Create New Wallet"
              onPress={() => navigation.navigate('CreateWallet')}
              style={styles.primaryBtn}
            />
            <Button
              title="Restore Existing Wallet"
              onPress={() => navigation.navigate('RestoreWallet')}
              variant="secondary"
              icon="download-outline"
              style={styles.secondaryBtn}
            />
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  cyclingContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  cyclingWord: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.textPrimary,
  },
  bottomSection: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
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
  buttons: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  primaryBtn: {
    borderRadius: 50,
  },
  secondaryBtn: {
    borderRadius: 50,
  },
});
