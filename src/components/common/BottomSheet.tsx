import React, {ReactNode} from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, borderRadius} from '@theme/index';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({visible, onClose, children}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {paddingBottom: insets.bottom + spacing.lg},
          ]}>
          <View style={styles.handle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
});
