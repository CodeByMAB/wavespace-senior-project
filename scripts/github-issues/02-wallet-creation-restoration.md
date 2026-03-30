## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Implement wallet creation with BIP39 mnemonic, wallet restoration from seed phrase, and security (PIN/biometric). Private keys must be encrypted and stored in device keychain.

**Related SRS Requirements:** FR-WM-001, FR-WM-002, FR-WM-003

## Tasks
- [ ] Implement BIP39 mnemonic generation (12 or 24 word)
- [ ] Implement BIP44 derivation path m/84'/0'/0' for native SegWit
- [ ] Encrypt private keys with AES-256-GCM; store in React Native Keychain (iOS/Android)
- [ ] Wallet creation flow: generate → display seed → user confirms backup → derive keys → encrypt & store
- [ ] Wallet restoration: accept 12/24 word mnemonic, validate checksum, derive keys, sync via Breez SDK
- [ ] Support optional BIP39 passphrase on restore
- [ ] Implement PIN (6-digit min) and biometric (Face ID / fingerprint)
- [ ] Require auth on app launch and before sensitive operations (send, export)
- [ ] Rate-limit failed auth (3 attempts, 30-second lockout); exponential backoff
- [ ] Biometric fallback to PIN when unavailable

## Acceptance Criteria
- [ ] AC-WM-001-01: System generates 12-word or 24-word mnemonic
- [ ] AC-WM-001-02: User must confirm they have backed up the seed phrase
- [ ] AC-WM-001-03: System derives wallet keys using BIP44
- [ ] AC-WM-001-04: Private keys encrypted with AES-256, stored in device keychain
- [ ] AC-WM-001-05: Wallet creation completes within 5 seconds
- [ ] AC-WM-002-01 to 05: Restore accepts mnemonic, validates, derives, syncs; completes within 30s (excl. sync)
- [ ] AC-WM-003-01 to 05: PIN/biometric on launch and sensitive ops; rate limit; biometric fallback

## Security Requirements
- Use expo-secure-store / React Native Keychain for secrets
- Store PIN hash (bcrypt) in secure storage
- Never log or display mnemonic after backup confirmation

## Dependencies
- [ ] #1 Setup Expo Project with Breez SDK Integration

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/08b75777-3b05-4a6d-adb0-d25258d13502`
