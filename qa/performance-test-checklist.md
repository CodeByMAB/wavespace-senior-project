# Performance test checklist (ticket QA artifact)

Record results in `qa/reports/` (see `coverage-signoff-template.json` for a complementary coverage artifact).

Targets below match SRS / ticket QA acceptance criteria. **Reference device for sign-off:** iPhone 15 or Google Pixel 8 (or equivalent mid-tier device from the same generation).

## Cold start

- [ ] Time from tap to interactive welcome &lt; **3,000** ms (device: **iPhone 15 / Pixel 8 (reference)**).
- [ ] No main-thread ANR on Android during startup.

## Wallet / SDK

- [ ] Connect + initial sync: completes without UI freeze beyond **10** s on reference network (aligns with payment execution budget).
- [ ] Subsequent foreground: balance refresh &lt; **2** s (aligns with payment creation target).

## Lists and navigation

- [ ] Transaction list scroll remains ≥ **60** fps with **100** rows; **100** items load or update within **1,000** ms.
- [ ] Send / Receive / Settings navigation: no jank on mid-tier device (specify model).

## Network

- [ ] Price fetch and cache: UI not blocked; failures degrade gracefully.
- [ ] Offline mode: clear user messaging; no crash on failed fetch.

## Memory

- [ ] Peak / sustained resident memory remains below **200** MB during normal use; no sustained growth over **30** min send/receive simulation (MB delta **&lt; 50** vs baseline after stabilization).

## Battery

- [ ] Active wallet use: battery drain **&lt; 5%** per hour on reference device under typical screen-on usage.

## Sign-off

| Field       | Value |
| ----------- | ----- |
| Build / tag |       |
| Date        |       |
| Reviewer    |       |
| Device(s)   |       |
