import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Image} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {GradientBackground} from '@components/common/GradientBackground';
import {Button} from '@components/common/Button';
import {colors, spacing, typography} from '@theme/index';
import {OnboardingStackParamList} from '@navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const CYCLING_WORDS = ['Send', 'Stack', 'Spend', 'Save'];
const CYCLE_DURATION = 2500;

function CyclingText() {
  const currentRef = useRef(0);
  const fadeAnims = useRef(CYCLING_WORDS.map(() => new Animated.Value(0.15))).current;

  useEffect(() => {
    Animated.timing(fadeAnims[0], {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      const current = currentRef.current;
      const next = (current + 1) % CYCLING_WORDS.length;
      currentRef.current = next;

      Animated.timing(fadeAnims[current], {
        toValue: 0.15,
        duration: 400,
        useNativeDriver: true,
      }).start();

      Animated.timing(fadeAnims[next], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
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

export default function WelcomeScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground glow>
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.topSection}>
          <CyclingText />
        </View>

        <View style={[styles.bottomSection, {paddingBottom: insets.bottom + spacing.xxl}]}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

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
  logo: {
    width: 52,
    height: 52,
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
