## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Initialize the Expo project with all required dependencies, configure the Breez SDK for React Native, and set up the basic project structure.

**Related SRS Requirements:** FR-SDK-001, Section 8 (Expo Deployment)

## Tasks
- [ ] Create new Expo project (SDK 50+)
- [ ] Install Breez SDK: `npx expo install @breeztech/breez-sdk-spark-react-native`
- [ ] Add Expo plugins: Breez SDK, expo-camera, expo-local-authentication to app.json
- [ ] Configure app.json: name, slug, bundleIdentifier, permissions (NSCameraUsageDescription, NSFaceIDUsageDescription, CAMERA, USE_BIOMETRIC)
- [ ] Install required Expo packages: expo-secure-store, expo-clipboard, expo-sharing, expo-constants, expo-updates
- [ ] Install React Navigation and react-native-svg
- [ ] Set up EAS Build configuration (eas.json) for development, preview, production
- [ ] Verify prebuild and run:ios / run:android (custom dev build required; Expo Go not supported)
- [ ] Create basic folder structure (screens, components, services, utils)

## Acceptance Criteria
- [ ] AC: Project builds with `npx expo prebuild` and `npx expo run:ios` / `run:android`
- [ ] AC: Breez SDK plugin is configured in app.json
- [ ] AC: All dependencies from SRS Section 8.5 are installed with correct versions
- [ ] AC: iOS (min 13.0) and Android (min SDK 26) requirements met
- [ ] AC: Basic navigation skeleton present

## Technical Notes
- **Reason for Custom Build:** Breez SDK contains native code and cannot run in Expo Go.
- Build commands: `npx expo prebuild`, `npx expo run:ios`, `npx expo run:android`, `eas build --platform ios|android`

## Dependencies
- None (foundation issue)

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a874f80c-4a7b-4e6e-a62c-afb291a83550`
