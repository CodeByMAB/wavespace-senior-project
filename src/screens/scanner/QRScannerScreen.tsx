import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {Button} from '@components/common/Button';
import {colors, spacing, typography} from '@theme/index';
import type {HomeStackParamList} from '@/types/navigation';
import {detectPaymentType} from '@utils/bitcoin';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'QRScanner'>;
type ScannerRoute = RouteProp<HomeStackParamList, 'QRScanner'>;

export function QRScannerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScannerRoute>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const resumeAfterAlert = () => setScanned(false);

  const routePaymentPayload = (data: string) => {
    const trimmed = data.trim();
    if (!trimmed) {
      Alert.alert('Empty input', 'Paste or type an invoice, LNURL, or address.');
      return;
    }

    const {type, normalizedValue} = detectPaymentType(trimmed);
    const returnScreen = route.params.returnScreen;

    if (returnScreen === 'Withdraw') {
      if (type === 'bitcoin_address') {
        navigation.navigate('Withdraw', {
          scannedAddress: normalizedValue,
          scannedPayload: trimmed,
        });
        return;
      }
      Alert.alert(
        'Wrong QR type',
        'Withdraw only accepts Bitcoin address QR codes.',
        [{text: 'OK', onPress: resumeAfterAlert}],
      );
      return;
    }

    if (returnScreen === 'Send') {
      if (
        type === 'lightning_invoice' ||
        type === 'lnurl' ||
        type === 'lightning_address'
      ) {
        navigation.navigate('Send', {
          prefillInvoice: normalizedValue,
          paymentType: type,
        });
        return;
      }
      if (type === 'bitcoin_address') {
        Alert.alert(
          'Wrong screen',
          'Use Withdraw to scan a Bitcoin address, or scan a Lightning invoice here.',
          [{text: 'OK', onPress: resumeAfterAlert}],
        );
        return;
      }
      Alert.alert('Unrecognized QR code format', undefined, [
        {text: 'OK', onPress: resumeAfterAlert},
      ]);
    }
  };

  const handleBarCodeScanned = ({data}: {data: string}) => {
    if (scanned) return;
    setScanned(true);
    routePaymentPayload(data);
  };

  const confirmManualEntry = () => {
    routePaymentPayload(manualInput);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, {paddingTop: insets.top + spacing.lg}]}>
        <View style={[styles.centered, styles.permissionDeniedTop]}>
          <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.permissionText}>
            Camera access is needed to scan QR codes. If you previously denied access, open
            Settings to enable the camera, or enter payment details manually below.
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
          <Button
            title="Open Settings"
            variant="secondary"
            onPress={() => {
              void Linking.openSettings();
            }}
          />
          <Button
            title="Go Back"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </View>
        <View style={styles.permissionManualSection}>
          {showManual ? (
            <>
              <Text style={styles.permissionManualLabel}>Manual entry</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Paste or type invoice, LNURL, or address"
                placeholderTextColor={colors.textTertiary}
                value={manualInput}
                onChangeText={setManualInput}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <Button title="Confirm" onPress={confirmManualEntry} />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setShowManual(false);
                  setManualInput('');
                }}
              />
            </>
          ) : (
            <Button
              title="Enter manually"
              variant="ghost"
              onPress={() => setShowManual(true)}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{barcodeTypes: ['qr']}}
        enableTorch={torchEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay}>
        <View style={[styles.topOverlay, {paddingTop: insets.top}]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan QR Code</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setTorchEnabled(v => !v)}
            accessibilityRole="button"
            accessibilityLabel={torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight'}>
            <Ionicons
              name={torchEnabled ? 'flashlight' : 'flashlight-outline'}
              size={26}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>

        <View
          style={[
            styles.bottomOverlay,
            {paddingBottom: Math.max(insets.bottom, spacing.lg)},
          ]}>
          {showManual ? (
            <>
              <TextInput
                style={styles.manualInput}
                placeholder="Paste or type invoice, LNURL, or address"
                placeholderTextColor={colors.textTertiary}
                value={manualInput}
                onChangeText={setManualInput}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <Button title="Confirm" onPress={confirmManualEntry} />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setShowManual(false);
                  setManualInput('');
                }}
              />
            </>
          ) : (
            <>
              <Text style={styles.hint}>
                Point your camera at a Lightning invoice or Bitcoin address QR
                code
              </Text>
              <Button
                title="Enter manually"
                variant="ghost"
                onPress={() => setShowManual(true)}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 250;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  permissionDeniedTop: {
    flex: 0,
    paddingBottom: spacing.lg,
  },
  permissionManualSection: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  permissionManualLabel: {
    ...typography.label,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
  permissionText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: colors.primary,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'stretch',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  hint: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  manualInput: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
