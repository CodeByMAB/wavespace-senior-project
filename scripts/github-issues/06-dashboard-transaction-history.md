## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Implement the main Dashboard (wallet overview, Lightning balance, quick actions: Send, Receive, Withdraw, Scan) and unified Transaction History (Lightning send/receive, withdrawals, filters, search, details). Align with SRS wireframes (FR-UI-001, FR-HIST-001, FR-HIST-002).

**Related SRS Requirements:** FR-UI-001, FR-HIST-001, FR-HIST-002, Section 5 wireframes

## Tasks
- [ ] Dashboard: Display total Lightning balance (from Breez SDK node state)
- [ ] Dashboard: Recent transactions (last 5); quick action buttons Send, Receive, Withdraw, Scan
- [ ] Dashboard: Connection status; inbound/outbound liquidity summary; channel count
- [ ] Dashboard loads within 1 second (AC-UI-001-05)
- [ ] Transaction list: All types (Lightning sent/received, withdrawals, pending); type, amount, date, status
- [ ] Filter by type (Lightning, withdrawal, all); search by description or amount; infinite scroll (e.g. 50 per page)
- [ ] Transaction details: Withdrawal → destination address, amount, fee, confirmations, txid; Lightning → invoice, amount, fee, preimage, description
- [ ] Copy/share transaction details; link to block explorer for withdrawals (e.g. mempool.space)
- [ ] Data source: Breez SDK transaction history; cache in local SQLite for performance

## Acceptance Criteria
- [ ] AC-UI-001-01 to 05: Balance, recent 5 tx, quick actions, connection status, load &lt;1s
- [ ] AC-HIST-001-01 to 05: List all tx, type/amount/date/status, filter, search, pagination
- [ ] AC-HIST-002-01 to 05: Withdrawal details (address, fee, confirmations, txid); Lightning details; copy; share; block explorer link

## Wireframes
See SRS Section 5 (FR-UI-001 Dashboard wireframe) for layout reference.

## Dependencies
- [ ] #1 Setup Expo Project with Breez SDK Integration
- [ ] #2 Implement Wallet Creation and Restoration
- [ ] #3 Initialize Breez SDK and Lightning Node
- [ ] #4 Implement Lightning Payment Operations
- [ ] #5 Implement Withdrawal to External Bitcoin Address

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/08efc6d9-1116-4964-a565-6aa01ca90060`
