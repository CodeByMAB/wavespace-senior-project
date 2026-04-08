export const colors = {
  // Backgrounds
  background: '#0D0D0D',
  backgroundSecondary: '#1A1A2E',
  surface: '#1E1E2E',
  surfaceElevated: '#252540',

  // Primary accent (Bitcoin orange)
  primary: '#F7931A',
  primaryLight: '#FFB347',
  primaryDark: '#CC7A15',
  primaryMuted: 'rgba(247, 147, 26, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textTertiary: '#6B6B7B',
  textInverse: '#0D0D0D',

  // Semantic
  success: '#00C853',
  successMuted: 'rgba(0, 200, 83, 0.15)',
  error: '#FF5252',
  errorMuted: 'rgba(255, 82, 82, 0.15)',
  warning: '#FFB300',
  warningMuted: 'rgba(255, 179, 0, 0.15)',
  info: '#448AFF',
  infoMuted: 'rgba(68, 138, 255, 0.15)',

  // Borders
  border: '#2A2A3E',
  borderLight: '#3A3A4E',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: 'rgba(255, 255, 255, 0.05)',

  // Transaction-specific
  sent: '#FF5252',
  received: '#00C853',
  pending: '#FFB300',

  // Channel-specific
  channelLocal: '#F7931A',
  channelRemote: '#448AFF',
} as const;

export type ColorKey = keyof typeof colors;
