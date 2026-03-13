## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Implement QR code scanning (for payment requests, invoices, LNURL) and QR code generation (for Lightning invoices). Use expo-camera for scanning and react-native-svg or similar for rendering. Decode within 2 seconds (NFR-PERF-007).

**Related SRS Requirements:** FR-UI-002 (Send: scan QR), FR-UI-003 (Receive: display QR), FR-PAY-003/004, NFR-PERF-007

## Tasks
- [ ] Camera permission handling (NSCameraUsageDescription, CAMERA); request at runtime
- [ ] Scan screen: open camera; capture QR; decode string (Bolt11, LNURL, Lightning address, BIP21); pass to send flow or appropriate handler
- [ ] Decode within 2 seconds (average) per NFR-PERF-007
- [ ] Generate QR for Lightning invoice: render Bolt11 (uppercase) as QR; display on Receive screen; support copy and share
- [ ] Handle invalid/expired QR gracefully; support paste as alternative to scan
- [ ] Optional: BIP353 human-readable payment addresses if in scope

## Acceptance Criteria
- [ ] User can scan QR for Lightning invoice, LNURL, or Lightning address and proceed to pay
- [ ] User can generate and display QR for Lightning invoice; copy and share
- [ ] QR scan decode &lt;2s (average); camera permission requested and respected
- [ ] Invalid/expired QR shows clear error; paste fallback works

## Technical Notes
- expo-camera for scanning; react-native-svg for QR rendering. SRS 8.5.1: expo-camera ~14.0.0; 8.5.2: react-native-svg ^14.0.0.

## Dependencies
- [ ] #1 Setup Expo Project with Breez SDK Integration
- [ ] #4 Implement Lightning Payment Operations

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/94b92298-c5b1-4c1e-9149-496b439242e1`
