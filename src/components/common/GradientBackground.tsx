import React, {ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors} from '@theme/index';

interface GradientBackgroundProps {
  children: ReactNode;
  colors?: readonly [string, string, ...string[]];
  /** Show a radial-style amber glow at the top (for onboarding screens) */
  glow?: boolean;
}

export function GradientBackground({
  children,
  colors: customColors,
  glow = false,
}: GradientBackgroundProps) {
  const gradientColors: readonly [string, string, ...string[]] =
    customColors || [colors.background, colors.backgroundSecondary];

  if (glow) {
    return (
      <View style={styles.base}>
        {/* Amber/orange radial glow at the top */}
        <LinearGradient
          colors={['rgba(247, 147, 26, 0.25)', 'rgba(247, 147, 26, 0.08)', 'transparent']}
          style={styles.glowTop}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
        />
        {/* Side fade for softer edges */}
        <LinearGradient
          colors={['transparent', 'rgba(247, 147, 26, 0.06)', 'transparent']}
          style={styles.glowSide}
          start={{x: 0, y: 0.3}}
          end={{x: 1, y: 0.3}}
        />
        {children}
      </View>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.base}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  glowSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
});
