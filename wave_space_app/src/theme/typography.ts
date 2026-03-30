import {TextStyle, Platform} from 'react-native';

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  displayLarge: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    letterSpacing: -1,
  } as TextStyle,
  displayMedium: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
  } as TextStyle,

  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  } as TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  } as TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,

  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,

  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  mono: {
    fontSize: 14,
    fontFamily: monoFont,
    lineHeight: 20,
  } as TextStyle,
  monoLarge: {
    fontSize: 18,
    fontFamily: monoFont,
    lineHeight: 26,
  } as TextStyle,
} as const;
