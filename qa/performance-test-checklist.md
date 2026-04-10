# Performance test checklist (ticket QA artifact)

Record results in `qa/reports/` (see `coverage-signoff-template.json` for a complementary coverage artifact).

## Cold start

- [ ] Time from tap to interactive welcome &lt; **\_\_\_** ms (device: \_\_\_).
- [ ] No main-thread ANR on Android during startup.

## Wallet / SDK

- [ ] Connect + initial sync: completes without UI freeze beyond **\_\_\_** s on reference network.
- [ ] Subsequent foreground: balance refresh &lt; **\_\_\_** s.

## Lists and navigation

- [ ] Transaction list scroll remains ≥ **\_\_\_** fps with **\_\_\_** rows.
- [ ] Send / Receive / Settings navigation: no jank on mid-tier device (specify model).

## Network

- [ ] Price fetch and cache: UI not blocked; failures degrade gracefully.
- [ ] Offline mode: clear user messaging; no crash on failed fetch.

## Memory

- [ ] No sustained growth over **\_\_\_** min send/receive simulation (MB delta \_\_\_).

## Sign-off

| Field       | Value |
| ----------- | ----- |
| Build / tag |       |
| Date        |       |
| Reviewer    |       |
| Device(s)   |       |
