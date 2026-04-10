# Maestro E2E (critical flows)

These flows automate the critical paths referenced by QA ticket `8aac7435-def5-4837-bc7f-b1094e676254`. Flows 3–6 use conditional steps so a cold install (onboarding only) still passes file parsing; run against a device or emulator with a dev client where `appId` matches `app.json` (`com.anonymous.wavespace`).

**Flows 3 (send) and 6 (receive)** require a **funded testnet wallet** and working Breez/SDK connectivity so invoices and payments can complete (or surface the payment result alert). Without funds, steps after `Confirm & Send` or `Generate Invoice` may time out when those UI states never appear.

## Prerequisites

- [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro)
- iOS Simulator or Android emulator with the Wavespace dev build installed
- `EXPO_PUBLIC_BREEZ_API_KEY` (or app config) set for flows that complete SDK connect

## Run

```bash
npm run test:e2e
# or
bash scripts/qa-e2e-maestro.sh
# or run the whole directory (same flows; order not guaranteed)
maestro test maestro/
```

## CI

Use a dedicated job with an emulator/simulator and artifact upload of Maestro logs; the default GitHub Actions matrix only runs unit tests and coverage.
