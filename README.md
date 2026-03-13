# Wavespace — Bitcoin Lightning Wallet

A self-custodial Bitcoin Lightning Network wallet for iOS and Android, built with React Native, Expo, and the Breez SDK (Spark). All keys and transaction data stay on your device — no cloud, no KYC, no compromise.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Building for Device](#building-for-device)
- [Security Model](#security-model)
- [Documentation](#documentation)
- [Roadmap](#roadmap)

---

## Overview

Wavespace is a **Lightning-only (Layer 2)** wallet. It does not manage on-chain Bitcoin directly — all payments are routed through the Lightning Network via the Breez SDK Spark implementation. The only on-chain interaction is withdrawing Lightning funds to an **external** Layer 1 Bitcoin address that you control.

| Supported | Not Supported |
|---|---|
| Send & receive Lightning payments | On-chain Bitcoin management |
| Manage Lightning channels | Multi-device sync |
| Withdraw to external L1 address | Cloud backup |
| LNURL-Pay / LNURL-Withdraw | Desktop / web versions |
| Lightning address support | Custom Lightning node |
| Testnet & mainnet | |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Mobile App  (Expo / React Native)      │
│                                                   │
│  UI Screens  →  Context / Hooks  →  Services     │
│                      │                            │
│              Breez SDK Integration Layer          │
└──────────────────────┬────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   Lightning Net   Breez LSP   Bitcoin Net
                              (withdraw only)
```

**Layers:**

| Layer | Technology | Responsibility |
|---|---|---|
| UI | React Native + Expo | Screens, navigation, user input |
| State | React Context API | Auth state, wallet state, sync events |
| Business Logic | Custom hooks (`useWallet`, `useAuth`) | Fee logic, validation, retry |
| SDK Integration | Breez SDK Spark | Lightning node, payments, channels |
| Secure Storage | `expo-secure-store` + AES-256-GCM | Encrypted key storage |

---

## Features

### Wallet Management
- **Create** a new wallet with a cryptographically secure BIP39 mnemonic (12 or 24 words)
- **Guided seed backup** — mnemonic display followed by a word-order confirmation step
- **Restore** an existing wallet from any valid BIP39 mnemonic
- **BIP39 passphrase** support for additional key derivation security

### Authentication & Security
- **PIN setup** — bcrypt-hashed (12 rounds) 6-digit PIN
- **Biometric authentication** — Face ID / Touch ID via `expo-local-authentication`
- **Rate limiting** — 30-second lockout after 3 consecutive failed PIN attempts
- **Screen capture prevention** — `expo-screen-capture` blocks screenshots on sensitive screens
- **Auto-lock** — wallet disconnects from the Breez SDK on sign-out

### Lightning Network
- Breez SDK Spark integration for nodeless Lightning operations
- Automatic channel opening via Breez LSP
- Real-time balance with pending send/receive breakdown
- Mainnet and testnet (regtest) network selection
- SDK event listener for sync and payment events

### Dashboard
- Live Lightning balance (satoshis)
- Connection status indicator (Disconnected / Syncing / Synced)
- Node identity pubkey (truncated display)
- Network badge (Mainnet / Testnet)
- Pending inbound and outbound payment totals
- Last-synced timestamp
- Manual refresh

---

## Tech Stack

| Category | Package | Version |
|---|---|---|
| Framework | Expo | ~55.0 |
| Runtime | React Native | 0.83.2 |
| Language | TypeScript | ~5.9 |
| Lightning | `@breeztech/breez-sdk-spark-react-native` | ^0.10 |
| Navigation | React Navigation (native stack) | ^7 |
| Crypto | `@noble/ciphers` (AES-256-GCM) | ^2.1 |
| Mnemonic | `bip39` | ^3.1 |
| PIN hashing | `bcryptjs` | ^3.0 |
| Secure storage | `expo-secure-store` | ~55.0 |
| Biometrics | `expo-local-authentication` | ~55.0 |
| QR scanning | `expo-camera` | ~55.0 |
| Clipboard | `expo-clipboard` | ~55.0 |

---

## Project Structure

```
wavespace-senior-project/
├── docs/
│   ├── BRS.md                     # Business Requirements Specification
│   └── SRS.md                     # Software Requirements Specification
├── scripts/
│   └── github-issues/             # Issue templates for sprint backlog
└── wavespace/                     # Expo application root
    ├── App.tsx                    # Root component (providers + navigator)
    ├── app.json                   # Expo config (permissions, plugins)
    ├── src/
    │   ├── constants/
    │   │   └── storage.ts         # AsyncStorage / SecureStore key names
    │   ├── context/
    │   │   ├── AuthContext.tsx    # Authentication state provider
    │   │   └── WalletContext.tsx  # Wallet state provider (wraps useWallet)
    │   ├── hooks/
    │   │   ├── useAuth.ts         # PIN / biometric auth logic
    │   │   └── useWallet.ts       # SDK lifecycle, balance, sync events
    │   ├── navigation/
    │   │   └── RootNavigator.tsx  # Onboarding / auth-gate / dashboard routing
    │   ├── screens/
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── CreateWalletScreen.tsx
    │   │   ├── MnemonicDisplayScreen.tsx
    │   │   ├── MnemonicConfirmScreen.tsx
    │   │   ├── RestoreWalletScreen.tsx
    │   │   ├── PinSetupScreen.tsx
    │   │   ├── BiometricSetupScreen.tsx
    │   │   ├── UnlockScreen.tsx
    │   │   └── DashboardScreen.tsx
    │   ├── services/
    │   │   ├── authService.ts         # PIN hashing, biometric prompts, rate-limit
    │   │   ├── mnemonicService.ts     # BIP39 generate / validate / split
    │   │   ├── secureStorageService.ts # AES-256-GCM encrypt + SecureStore
    │   │   └── walletService.ts       # Breez SDK init, node state, payments
    │   └── types/
    │       └── wallet.ts              # Shared TypeScript interfaces
    ├── android/                   # Android native project (Expo prebuild)
    └── ios/                       # iOS native project (Expo prebuild)
```

---

## Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 22 | Required by Expo 55 |
| npm | 10 | Bundled with Node 22 |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` (for device builds) |
| Xcode | 16+ | macOS only, required for iOS builds |
| Android Studio | latest | Required for Android builds |
| Breez API key | — | Obtain from [breez.technology](https://breez.technology) |

> **Note:** The Breez SDK Spark native module requires a **custom development build**. It is not compatible with Expo Go.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/wavespace-senior-project.git
cd wavespace-senior-project/wavespace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your Breez API key

The Breez SDK requires an API key at runtime. Set it as an environment variable or add it to your EAS secrets before building:

```bash
export BREEZ_API_KEY="your_api_key_here"
```

### 4. Run the development build on a simulator

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

> These commands trigger `expo run:ios` / `expo run:android` which perform a native prebuild automatically.

---

## Building for Device

Wavespace uses [EAS Build](https://docs.expo.dev/build/introduction/) for distributing development and production builds.

```bash
# Development build (internal testing)
eas build --profile development --platform ios
eas build --profile development --platform android

# Production build
eas build --profile production --platform all
```

The `eas.json` in the `wavespace/` directory contains the build profiles.

---

## Security Model

| Concern | Implementation |
|---|---|
| Mnemonic at rest | AES-256-GCM encryption; unique 96-bit nonce per write |
| Encryption key | Stored in iOS Keychain / Android Keystore with `requireAuthentication: true` |
| PIN storage | bcrypt hash (12 salt rounds) — plaintext PIN never persisted |
| Brute-force protection | 30-second lockout after 3 consecutive failed PIN attempts |
| Screen capture | `expo-screen-capture` prevents screenshots on sensitive screens |
| Data residency | All keys and transaction history stored on-device only — no cloud, no telemetry |
| Network transport | TLS 1.3 enforced for all Breez SDK and LSP communication |
| Privacy / GDPR | Zero user data leaves the device |

---

## Documentation

Full specification documents are in the `docs/` directory:

- [`docs/BRS.md`](docs/BRS.md) — Business Requirements Specification (v1.1)
- [`docs/SRS.md`](docs/SRS.md) — Software Requirements Specification (v1.1)

---

## Roadmap

Upcoming work tracked via GitHub Issues (see `scripts/github-issues/`):

- [ ] Lightning invoice creation and payment UI
- [ ] QR code scanning and generation
- [ ] LNURL-Pay / LNURL-Withdraw flows
- [ ] Withdrawal to external Layer 1 Bitcoin address
- [ ] Transaction history screen
- [ ] Channel management view
- [ ] Settings and network switching UI
- [ ] App Store / Play Store deployment
- [ ] Multi-device sync (future release)

---

*Prepared by MAB — Wave.Space Senior Project, 2026*
