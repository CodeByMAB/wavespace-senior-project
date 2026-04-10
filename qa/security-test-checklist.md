# Security test checklist (ticket QA artifact)

Use this checklist for manual and automated security review sign-off. Store completed copies under `qa/reports/` with date and reviewer.

## Secrets and key material

- [ ] Mnemonic and PIN are never logged in release builds.
- [ ] Secure storage (Keychain / Keystore) used for PIN hash and mnemonic; no plaintext mnemonic in AsyncStorage.
- [ ] Clipboard usage for sensitive data is time-limited or avoided where feasible.
- [ ] Screenshots blocked or warned on sensitive screens where `expo-screen-capture` applies.

## Authentication and lock

- [ ] Failed PIN lockout and cooldown match product rules (e.g. 3 attempts / 30s window).
- [ ] Biometric path fails closed when hardware unavailable or not enrolled.
- [ ] App returns to unlock after backgrounding beyond policy (if implemented).

## Network and payments

- [ ] TLS-only APIs; no cleartext secrets in query strings.
- [ ] Payment URIs validated before send; user confirms amount and destination on review screen.
- [ ] LNURL / Lightning address parsing does not execute arbitrary URLs without user intent.

## Supply chain

- [ ] Dependencies reviewed for known advisories (`npm audit`) before release.
- [ ] Native modules (Breez SDK, Expo) pinned to audited versions in `package.json`.

## Sign-off process (coverage)

After `npm run test:coverage` passes in CI (or locally with the same thresholds as `vitest.config.ts`):

1. Copy `qa/reports/coverage-signoff-template.json` to `qa/reports/coverage-signoff-<YYYY-MM-DD>.json` (use the review date).
2. Fill in `buildOrTag`, `date`, `reviewer`, and `vitest.overallLinesPct` from `coverage/coverage-summary.json` (total lines percent).
3. Set `vitest.thresholdsMet` to `true` when coverage thresholds are satisfied; set `approval.approved` to `true` and add brief `approval.comments` if anything was waived or scoped.
4. Commit the dated JSON under `qa/reports/` with the release or QA milestone, or attach it as a CI artifact named per `coverage-signoff-template.json` → `artifacts.ciArtifactName`.

## Sign-off

| Field        | Value |
| ------------ | ----- |
| Build / tag  |       |
| Date         |       |
| Reviewer     |       |
| Notes        |       |
