## Epic Reference
Part of Epic: **Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`)
SRS Spec: `spec:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/a8f8bef7-d1c5-4113-a9ad-6092120bfe76`

## Overview
Implement channel management and monitoring: automatic channel opening via Breez LSP, channel list view, balance/capacity display. Use Breez SDK listChannels(), nodeInfo(), and channel/sync events.

**Related SRS Requirements:** FR-CH-001, FR-CH-002, FR-CH-003, Section 7.5.2

## Tasks
- [ ] Rely on Breez LSP for automatic channel opening on first receive; show progress and notify user
- [ ] Display total Lightning balance (local balance), total channel capacity, inbound/outbound liquidity (from nodeInfo(), listChannels())
- [ ] Channel list: all channels with peer, capacity, local/remote balance, state (pending, active, inactive, closed)
- [ ] Channel details: channel ID, funding tx, age, total sent/received
- [ ] Real-time updates via SDK events (channelOpened, channelClosed, syncComplete); list updates within 500ms of state change
- [ ] Filter channels by state; handle channel opening failures gracefully (notify, retry option)
- [ ] Display balance in sats and BTC; optional progress bar for capacity utilization

## Acceptance Criteria
- [ ] AC-CH-001-01 to 05: Auto open on first receive, &lt;30s, progress notification, list update, handle failures
- [ ] AC-CH-002-01 to 05: Total balance, capacity, inbound/outbound, update &lt;500ms, sats and BTC
- [ ] AC-CH-003-01 to 05: List all active channels; peer, capacity, balances, state; details view; real-time; filter by state

## Technical Notes
- Data source: Breez SDK node state and channel manager. Breez SDK handles channel opening automatically via LSP.

## Dependencies
- [ ] #1 Setup Expo Project with Breez SDK Integration
- [ ] #2 Implement Wallet Creation and Restoration
- [ ] #3 Initialize Breez SDK and Lightning Node

---
**Ticket ID:** `ticket:97fd7dcb-10ec-46a8-b681-b2805eb0eb56/c129745f-d845-4a83-bb7b-37d9b46432f4`
