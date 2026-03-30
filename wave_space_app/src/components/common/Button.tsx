import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, borderRadius, typography} from '@theme/index';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, {bg: string; text: string; border?: string}> = {
  primary: {bg: colors.primary, text: colors.textInverse},
  secondary: {bg: colors.surfaceElevated, text: colors.textPrimary},
  outline: {bg: 'transparent', text: colors.primary, border: colors.primary},
  ghost: {bg: 'transparent', text: colors.primary},
  danger: {bg: colors.error, text: colors.textPrimary},
};

const sizeStyles: Record<ButtonSize, {padding: number; fontSize: number; iconSize: number}> = {
  sm: {padding: spacing.sm, fontSize: 13, iconSize: 16},
  md: {padding: spacing.lg, fontSize: 15, iconSize: 18},
  lg: {padding: spacing.xl, fontSize: 17, iconSize: 20},
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const containerStyle: ViewStyle = {
    backgroundColor: disabled ? colors.surfaceElevated : v.bg,
    paddingVertical: s.padding,
    paddingHorizontal: s.padding * 1.5,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...(v.border && {borderWidth: 1.5, borderColor: disabled ? colors.border : v.border}),
    ...(fullWidth && {width: '100%'}),
  };

  const textStyle: TextStyle = {
    color: disabled ? colors.textTertiary : v.text,
    fontSize: s.fontSize,
    fontWeight: '600',
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={s.iconSize}
              color={disabled ? colors.textTertiary : v.text}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
