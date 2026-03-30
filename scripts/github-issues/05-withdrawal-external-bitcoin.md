## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Implement withdrawal of Lightning funds to an **external** Layer 1 Bitcoin address. The destination address is NOT managed by this wallet. Validate address (bech32, P2SH, P2PKH), estimate fee via Breez SDK, construct and broadcast via Breez withdrawal service.

**Related SRS Requirements:** FR-PAY-001, FR-UI-004 (Withdraw screen), Section 7.5.1 (sendOnchain)

## Tasks
- [ ] Withdrawal screen: input external Bitcoin address and amount
- [ ] Validate address format: bech32, P2SH, P2PKH
- [ ] Fee estimation via Breez SDK (low, medium, high priority)
- [ ] Display total cost (amount + fee) in sats; user confirms
- [ ] Call Breez SDK sendOnchain({ address, amountSat, feeRate? }); broadcast within 30 seconds
- [ ] Display transaction ID for tracking; show in transaction history
- [ ] **Warnings:** Clearly state that the address is external and withdrawals are irreversible; require explicit confirmation

## Acceptance Criteria
- [ ] AC-PAY-001-01: User enters external Bitcoin address and amount
- [ ] AC-PAY-001-02: System validates address format (bech32, P2SH, P2PKH)
- [ ] AC-PAY-001-03: System estimates on-chain transaction fee
- [ ] AC-PAY-001-04: System displays total cost (amount + fee) in Lightning sats
- [ ] AC-PAY-001-05: User confirms withdrawal details
- [ ] AC-PAY-001-06: Withdrawal transaction broadcasts within 30 seconds
- [ ] AC-PAY-001-07: System displays transaction ID for tracking
- [ ] AC-PAY-001-08: Withdrawal appears in transaction history

## Technical Notes
- Address is **external** — not managed by this wallet. Emphasize in UI: "Withdrawals are irreversible. Verify the destination address carefully."
- Fee estimation and transaction construction: Breez SDK withdrawal service. Broadcast: Breez SDK to Bitcoin network.

## Dependencies
- [ ] #1 Setup Expo Project with Breez SDK Integration
- [ ] #2 Implement Wallet Creation and Restoration
- [ ] #3 Initialize Breez SDK and Lightning Node

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/5c9fdfc0-7456-4bdb-ae2b-08b4cbb1ab3d`
