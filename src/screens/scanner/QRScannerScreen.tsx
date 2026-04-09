import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {Button} from '@components/common/Button';
import {colors, spacing, typography} from '@theme/index';
import type {HomeStackParamList} from '@/types/navigation';
import {parseBitcoinDestination} from '@utils/bitcoin';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'QRScanner'>;
type ScannerRoute = RouteProp<HomeStackParamList, 'QRScanner'>;

export function QRScannerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScannerRoute>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({data}: {data: string}) => {
    if (scanned) return;
    setScanned(true);
    if (route.params.returnScreen === 'Withdraw') {
      const parsed = parseBitcoinDestination(data);
      navigation.navigate('Withdraw', {
        scannedAddress: parsed?.normalizedAddress,
        scannedPayload: data,
      });
      return;
    }
    navigation.goBack();
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.permissionText}>
          Camera access is needed to scan QR codes
        </Text>
        <Button title="Grant Permission" onPress={requestPermission} />
        <Button
          title="Go Back"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{barcodeTypes: ['qr']}}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay}>
        <View style={[styles.topOverlay, {paddingTop: insets.top}]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan QR Code</Text>
          <View style={{width: 40}} />
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

        <View style={styles.bottomOverlay}>
          <Text style={styles.hint}>
            Point your camera at a Lightning invoice or Bitcoin address QR code
          </Text>
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
  closeBtn: {
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
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  hint: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
