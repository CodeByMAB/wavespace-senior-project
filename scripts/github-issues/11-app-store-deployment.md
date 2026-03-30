## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Prepare for App Store and Play Store deployment: app metadata, privacy policy, store listings, EAS Submit configuration, screenshots, and compliance (export encryption, age rating). SRS Section 8.7 and 8.6.

**Related SRS Requirements:** Section 8.6 (Build and Deployment), 8.7 (App Store Submission), 8.4 (Assets)

## Tasks
- [ ] Finalize app icons and splash (SRS 8.4): iOS 1024x1024, adaptive Android; splash #667eea
- [ ] Privacy policy URL; host and link in app and store listings
- [ ] iOS: App Store Connect record; bundle ID; category Finance; age 4+; export compliance (ITSAppUsesNonExemptEncryption); screenshots 6.7", 6.5", 5.5"
- [ ] Android: Play Console; package name; Finance; content rating (ESRB Everyone); target 18+; screenshots and feature graphic 1024x500
- [ ] EAS Submit: configure eas.json submit section (appleId, ascAppId, appleTeamId; Android serviceAccountKeyPath, track)
- [ ] Build production with `eas build --platform ios|android`; submit with `eas submit`
- [ ] OTA updates: configure Expo Updates for JS/asset-only updates; document limitation (no native/Breez SDK updates via OTA)
- [ ] Document deployment runbook: build → test → submit → release

## Acceptance Criteria
- [ ] Production builds succeed for iOS and Android
- [ ] App Store Connect and Play Console listings prepared with required metadata and screenshots
- [ ] Privacy policy linked; export compliance and age ratings set
- [ ] EAS Submit configured and tested (internal/TestFlight first)
- [ ] Deployment documentation complete

## Technical Notes
- Cryptocurrency apps allowed (self-custodial) on both stores; comply with local laws; no gambling/illegal activity. SRS 8.7.1–8.7.2.

## Dependencies
- [ ] #10 Implement Testing Suite and Quality Assurance

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/bd143ec3-06af-4ce7-93e5-36582c228a1f`
