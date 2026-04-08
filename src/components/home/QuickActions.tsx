import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing} from '@theme/index';

interface QuickActionsProps {
  onSend: () => void;
  onReceive: () => void;
  onWithdraw: () => void;
  onScan: () => void;
}

const actions = [
  {key: 'send', icon: 'arrow-up' as const, label: 'Send'},
  {key: 'receive', icon: 'arrow-down' as const, label: 'Receive'},
  {key: 'withdraw', icon: 'link-outline' as const, label: 'Withdraw'},
  {key: 'scan', icon: 'scan-outline' as const, label: 'Scan'},
];

export function QuickActions({
  onSend,
  onReceive,
  onWithdraw,
  onScan,
}: QuickActionsProps) {
  const handlers: Record<string, () => void> = {
    send: onSend,
    receive: onReceive,
    withdraw: onWithdraw,
    scan: onScan,
  };

  return (
    <View style={styles.container}>
      {actions.map(({key, icon, label}) => (
        <TouchableOpacity
          key={key}
          style={styles.button}
          onPress={handlers[key]}
          activeOpacity={0.6}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  button: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },
});
