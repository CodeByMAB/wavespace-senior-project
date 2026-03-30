import {ExpoConfig, ConfigContext} from 'expo/config';

export default ({config}: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Wavespace',
  slug: 'wavespace',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'wavespace',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#0D0D0D',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.wavespace.app',
    infoPlist: {
      NSCameraUsageDescription:
        'Wavespace needs camera access to scan QR codes for Lightning payments.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0D0D0D',
    },
    package: 'com.wavespace.app',
    permissions: ['CAMERA'],
  },
  plugins: [
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow Wavespace to access your camera to scan QR codes.',
      },
    ],
    'expo-secure-store',
  ],
});
