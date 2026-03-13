## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Implement Settings and Configuration: network selection (testnet/mainnet), display units (BTC/sats/both), security settings (PIN change, biometric, auto-lock, backup export). Network change requires wallet restart and reinitialize Breez SDK.

**Related SRS Requirements:** FR-SET-001, FR-SET-002, FR-SET-003

## Tasks
- [ ] Network selection: allow switch between Bitcoin Testnet and Mainnet; show clear warning; require confirmation; store testnet/mainnet data separately; restart app and reinitialize Breez SDK with new network
- [ ] Display current network in app header/settings
- [ ] Display units: BTC, satoshis, or both; apply app-wide; immediate effect; default satoshis; store in AsyncStorage
- [ ] Security: Change PIN (require current PIN, confirm new); enable/disable biometric (check device capability); auto-lock timeout (1, 5, 15 min, never)
- [ ] Security alerts: large balance warnings, unconfirmed transaction warnings
- [ ] Export wallet backup: encrypted JSON with mnemonic; require auth

## Acceptance Criteria
- [ ] AC-SET-001-01 to 05: Select network in settings; change requires restart; warning; separate storage; current network in header
- [ ] AC-SET-002-01 to 05: Unit selection BTC/sats/both; app-wide; immediate; default sats; both simultaneous
- [ ] AC-SET-003-01 to 05: Change PIN; enable/disable biometric; auto-lock options; view security alerts; export encrypted backup

## Technical Notes
- Restart: Reinitialize Breez SDK with new network (Section 4.6). Default network for initial releases: Testnet.

## Dependencies
- [ ] #1 Setup Expo Project with Breez SDK Integration
- [ ] #2 Implement Wallet Creation and Restoration
- [ ] #3 Initialize Breez SDK and Lightning Node

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/535db241-da9c-4021-8fa7-46955fdd573d`
