# Wavespace — Bitcoin Lightning Wallet

Self-custodial Bitcoin Lightning wallet for iOS and Android, built with React Native, Expo, and the Breez SDK (Spark). Keys and wallet data stay on the device — no cloud wallet backend, no KYC in the app.

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment](#environment)
- [Building for device](#building-for-device)
- [Testing & quality](#testing--quality)
- [Security model](#security-model)
- [Documentation & requirements](#documentation--requirements)
- [Compliance (binding BRS / SRS)](#compliance-binding-brs--srs)
- [Known gaps & roadmap](#known-gaps--roadmap)

---

## Overview

Wavespace is a **Lightning-first (Layer 2)** wallet. It does not implement a general-purpose on-chain (Layer 1) wallet: Lightning send/receive, channel visibility, and **withdrawal to an external** Bitcoin address are handled through the Breez Spark SDK and LSP. That scope matches the [Software Requirements Specification](docs/SRS.md) (see its architectural note).

| Supported | Not supported |
|-----------|----------------|
| Send & receive Lightning (BOLT11), LNURL-Pay, Lightning addresses | In-app self-custodial on-chain BTC wallet (receive/hold L1 in-app) |
| Withdraw Lightning balance to an external L1 address | Multi-device sync |
| Create invoices, QR receive/share, camera scan | Cloud backup |
| Channel list & detail, liquidity indicators | Custom full Lightning node |
| Transaction history (SDK-backed, paginated) | Desktop / web product |
| Mainnet & testnet, display units, backup/export flow | — |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│     Mobile app (Expo / React Native)            │
│  UI → Context / hooks → services                │
│           Breez SDK Spark integration             │
└──────────────────────┬───────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   Lightning      Breez LSP    Bitcoin network
   Network                      (withdraw to external address only)
```

| Layer | Technology | Role |
|-------|------------|------|
| UI | React Native, Expo | Screens, navigation, tabs (Home, Activity, Settings) |
| State | React Context | Auth, wallet, settings (network, units, security alerts, auto-lock) |
| Logic | Hooks (`useWallet`, `useAuth`) | SDK lifecycle, balance, events, retries |
| Lightning | `@breeztech/breez-sdk-spark-react-native` | Nodeless Lightning operations |
| Storage | `expo-secure-store` + AES-256-GCM (`secureStorageService`) | Encrypted sensitive material |
| Other | AsyncStorage | Non-secret preferences and flags |

---

## Features

### Wallet lifecycle

- Create wallet with BIP39 mnemonic (12 or 24 words), optional BIP39 passphrase.
- Guided backup: mnemonic display and confirmation grid.
- Restore from mnemonic.
- Settings: backup/export flow (`BackupExportScreen`).

### Authentication & device security

- 6-digit PIN with bcrypt hashing; biometric unlock (Face ID / Touch ID).
- Rate limiting: lockout after repeated failed PIN attempts (`authService`).
- Optional screenshot blocking on sensitive onboarding flows (`expo-screen-capture`).
- Configurable auto-lock after background time (`RootNavigator` + settings).
- Wallet disconnect on sign-out.

### Lightning & payments

- Breez Spark: connect, sync, balance, pending inbound/outbound context.
- **Send:** BOLT11, LNURL-Pay, Lightning address (parsed via SDK); on-chain **send** from the Send screen is rejected — use **Withdraw** for external L1 destinations (`walletService`).
- **Receive:** amount/memo invoice, QR, share/copy; channel-opening progress where applicable.
- **Withdraw:** external Bitcoin address, fee estimation, confirmation speed selection.
- **QR:** `expo-camera` scanner for Send and Withdraw.
- **Channels:** list and detail screens backed by SDK channel data.
- **Activity:** transaction list with filters, pull-to-refresh, pagination, detail screen.

### Settings

- Network: mainnet / testnet.
- Display units (BTC / sats / fiat-aware formatting via price service).
- Security: biometrics, change PIN, large-balance and unconfirmed-activity alerts on home.
- About screen.

---

## Tech stack

Versions below reflect `package.json` at the repository root.

| Area | Package | Version (approx.) |
|------|---------|-------------------|
| Framework | Expo | ~55.0 |
| Runtime | React Native | 0.83.x |
| Language | TypeScript | ~5.9 |
| Lightning | `@breeztech/breez-sdk-spark-react-native` | ^0.10 |
| Navigation | React Navigation (native stack + bottom tabs) | ^7 |
| Crypto | `@noble/ciphers`, `@noble/hashes` | ^2.x / ^1.x |
| Mnemonic | `bip39` | ^3.1 |
| PIN | `bcryptjs` | ^3.0 |
| Secure storage | `expo-secure-store` | ~55.0 |
| Biometrics | `expo-local-authentication` | ~55.0 |
| Camera / QR | `expo-camera`, `react-native-qrcode-svg` | ~55.0 / ^6.3 |
| Tests | Vitest, `@vitest/coverage-v8` | ^3.2 |
| E2E | Maestro (CLI installed separately) | — |

---

## Project structure

```
wavespace-senior-project/
├── docs/
│   ├── BRS.md                 # Business requirements
│   └── SRS.md                 # Software requirements
├── maestro/                   # Maestro E2E flows (see maestro/README.md)
├── scripts/
│   ├── qa-e2e-maestro.sh      # npm run test:e2e
│   └── github-issues/         # Issue templates / backlog helpers
├── src/
│   ├── components/            # Shared UI (buttons, cards, home widgets, …)
│   ├── constants/             # Storage keys, shared constants
│   ├── context/             # Auth, wallet, settings, onboarding gate
│   ├── data/                  # Mock data for dev/tests (not primary runtime path)
│   ├── hooks/                 # useWallet, useAuth
│   ├── integration/           # Vitest integration tests
│   ├── navigation/            # Root, onboarding, main tabs, stacks
│   ├── screens/
│   │   ├── auth/
│   │   ├── channels/
│   │   ├── home/
│   │   ├── onboarding/
│   │   ├── receive/
│   │   ├── scanner/
│   │   ├── send/
│   │   ├── settings/
│   │   ├── transactions/
│   │   └── withdraw/
│   ├── services/            # wallet, auth, mnemonic, secure storage, price
│   ├── theme/
│   ├── types/
│   └── utils/
├── App.tsx
├── app.json                  # Expo config (plugins, permissions)
├── eas.json                  # EAS Build profiles
├── index.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

Legacy and experimental trees live under `archive/` (excluded from TypeScript project).

---

## Prerequisites

| Tool | Notes |
|------|--------|
| Node.js | CI runs **18.x** and **20.x**; use an LTS version compatible with your Expo SDK. |
| npm | Comes with Node. |
| Xcode / Android Studio | For simulators and device builds. |
| Breez API key | From [breez.technology](https://breez.technology); required at runtime for the SDK. |

The Breez Spark native module requires a **custom development build** — not Expo Go.

---

## Getting started

```bash
git clone git@github.com:CodeByMAB/wavespace-senior-project.git
cd wavespace-senior-project
npm install
```

Run on a simulator (native prebuild as needed):

```bash
npm run ios
npm run android
```

Start the Metro bundler alone:

```bash
npm start
```

---

## Environment

- Set `BREEZ_API_KEY` and/or `EXPO_PUBLIC_BREEZ_API_KEY` as required by your build pipeline (see Breez and Expo docs). EAS secrets can inject these for device builds.

---

## Building for device

[EAS Build](https://docs.expo.dev/build/introduction/) profiles are defined in `eas.json` (`development`, `preview`, `production`).

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

---

## Testing & quality

| Script | Purpose |
|--------|---------|
| `npm run lint` | Typecheck (`tsc --noEmit`, strict). |
| `npm run test` | Vitest unit tests. |
| `npm run test:coverage` | Unit tests with coverage thresholds (see `vitest.config.ts`). |
| `npm run test:integration` | Integration tests under `src/integration/`. |
| `npm run test:e2e` | Maestro flows via `scripts/qa-e2e-maestro.sh`. |

**CI:** GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run test:coverage`, and `npm run lint` on pushes and pull requests to `main`.

**E2E:** Install the [Maestro CLI](https://docs.maestro.dev/) and follow [`maestro/README.md`](maestro/README.md). Flows target the dev client package id from `app.json` (`com.anonymous.wavespace`).

---

## Security model

| Topic | Implementation |
|-------|----------------|
| Mnemonic at rest | AES-256-GCM with per-write nonce (`secureStorageService`). |
| Key access | Secure enclave / keystore via Expo SecureStore options where applicable. |
| PIN | bcrypt hash only; lockout after failed attempts. |
| Transport | HTTPS to Breez / LSP (TLS enforced by platform and SDK). |
| Privacy | No wallet backend; transactional data stays on device per product design. |

Some items in [SRS section 6](docs/SRS.md) (for example certificate pinning, root/jailbreak detection, code obfuscation) are **targets or SDK/platform concerns** — they are not all duplicated as first-party app code. Treat the SRS as the full requirement set; this table summarizes what the app layer explicitly implements.

---

## Documentation & requirements

| Document | Path |
|----------|------|
| Business Requirements Specification (v1.1) | [`docs/BRS.md`](docs/BRS.md) |
| Software Requirements Specification (v1.1) | [`docs/SRS.md`](docs/SRS.md) |

---

## Compliance (binding BRS / SRS)

[`docs/BRS.md`](docs/BRS.md) and [`docs/SRS.md`](docs/SRS.md) are the binding requirement sets. They are **not** edited to match the codebase. Whether the product **complies** is a formal judgment; the points below are a concise engineering assessment against the text of those documents as they exist in this repo.

**Bottom line:** the implementation **does not fully comply** with every binding BRS and SRS item. Many functional and security requirements are implemented in code; others are only partially met, not objectively verified (for example performance and uptime targets), or read differently across BRS versus SRS (for example BRS §1 / FR‑003 / FR‑005 versus SRS “Lightning-only” scope; BRS §8 “React/Electron” versus the actual Expo / React Native stack). BRS §11 deliverables such as `openapi.yaml` and scope items such as Wave.Space widget integration (BRS §2) are **not** present in this repository as written.

---

## Known gaps & roadmap

- **LNURL-Withdraw** (pull liquidity into the wallet via LNURL) is not wired as a dedicated flow; LNURL-Pay and lightning addresses are supported on Send.
- **Wave.Space services** embedded as in-wallet widgets (BRS) — not implemented.
- **Store release** — distribution and store listings are process work outside this README.
- **Multi-device sync / cloud backup** — explicitly future scope in SRS.

Issue templates and backlog notes: `scripts/github-issues/`.

---

*Prepared by MAB — Wave.Space Senior Project, 2026*
