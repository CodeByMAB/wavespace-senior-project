## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Implement Lightning payment operations: create invoice (receivePayment), pay invoice (sendPayment), decode invoice (parseInvoice), list payments. Support Bolt11, optional LNURL and Lightning address resolution via Breez SDK.

**Related SRS Requirements:** FR-PAY-002, FR-PAY-003, FR-PAY-004, FR-PAY-005, FR-PAY-006, Section 7.5.1

## Tasks
- [ ] Create Lightning invoice: receivePayment({ amountMsat?, description? }); display as text and QR; copy/share
- [ ] Pay Lightning invoice: decode with parseInvoice; sendPayment({ bolt11, amountMsat? }); show fee estimate; confirm; complete within 10s
- [ ] List payments: listPayments({ filter?, fromTimestamp?, toTimestamp? }); show in history
- [ ] Handle LNURL-Pay and LNURL-Withdraw (Breez SDK built-in); detect LNURL in QR
- [ ] Support Lightning address ([user@domain.com]): validate format, resolve to LNURL-Pay, send payment
- [ ] Error handling: insufficient funds, invoice expired, route not found, invalid input; user-friendly messages and retry where appropriate
- [ ] Monitor payment status via SDK events; update balance and UI immediately

## Acceptance Criteria
- [ ] AC-PAY-002-01 to 06: Create invoice, display QR/text, copy, monitor, notification within 1s, balance updates
- [ ] AC-PAY-003-01 to 06: Amount/description, Bolt11, QR/copy, expiry (default 1h), monitor
- [ ] AC-PAY-004-01 to 06: Scan/paste invoice, decode, show fee, confirm, complete &lt;10s, show result
- [ ] AC-PAY-005-01 to 05: LNURL detect, LNURL-Pay amount in range, LNURL-Withdraw, metadata, &lt;15s
- [ ] AC-PAY-006-01 to 05: Lightning address validation, resolve, amount/message, &lt;15s, cache 24h

## Payment Flow (conceptual)
- Receive: Create invoice → Show QR/Copy → Payment received event → Update balance & notify
- Send: Scan/Paste → Decode → Confirm amount & fee → Send → Success/Failure UI

## Dependencies
- [ ] #1 Setup Expo Project with Breez SDK Integration
- [ ] #2 Implement Wallet Creation and Restoration
- [ ] #3 Initialize Breez SDK and Lightning Node

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/8381c733-0d5e-4870-b95a-235c33662eba`
