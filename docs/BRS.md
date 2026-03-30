Business Requirements Specification
Wavespace‑Senior‑Project – Bitcoin Lightning Wallet
Version 1.1 | Prepared by: MAB
Date: 2026‑01‑25

### 1. Purpose
This Business Requirements Specification (BRS) documents the high‑level business objectives, key stakeholders, target users, functional and non‑functional requirements, constraints, and assumptions that will guide the development of an on‑device Bitcoin Lightning Wallet. The wallet will enable users to manage on‑chain Bitcoin, open and manage Lightning Channels, issue and pay Lightning invoices, and view balances and transaction histories, all from a single application.

### 2. Scope
| Component	| In Scope | Out of Scope | Notes |
| Ledger Storage – Local encrypted DB | Multi‑device sync | Cloud backup (future sprint) | ?? |
| Lightning Connector – Breez SDK for Lightning node | Payment routing across channels | Custom Lightning network integration (e.g., custom node) | To-do |
| User Interface – Mobile/App via App Stores (iOS / Play Store)| User onboarding | Native mobile versions | To-do |
| Compliance – KYC/AML - Not Required | No reporting necessary | No KYC process integration | Done |
| Wave.Space Services Integration | Integrate Wave.Space tools within wallet as widget for users | Tools made by other companies | If possible to implement | To-do |

### 3. Stakeholders
| Stakeholder | Role | Influence |
| Product Owner | Defines, prioritizes and reviews requirements. | High |
| Engineering Team | Implements, tests and hands over product. | High |
| QA & Test Engineering | Ensures quality, writes tests. | Medium |
| UX/UI Designer | Designs intuitive interface. | Medium |
| Legal/Compliance | Ensures regulatory alignment. | High |
| End‑Users	| Traders, everyday users, node operators. | Medium |

### 4. User Personas
| Persona | Goals | Pain Points |
| Trader “Ted” | Rapid payment, low latency, view channel stats | Complex setup process, uncertain fees |
| Everyday User “Eve” | Simple, secure payments for groceries, auto‑converts BTC to Lightning | Unfamiliar with blockchain jargon |
| Node Operator “Omar” | Manage multiple channels, receive invoices, monitor health | Needs analytics, automated alerts |

### 5. Business Objectives
| Objective | KPI | Target |
| Adoption | Number of wallet installs | 100 users by end‑Q2 |
| Usage | Number of lightning payments per user	| > 5 payments/month |
| Security | Zero critical vulnerabilities | OWASP Top‑10 compliance |
<--- | Performance | Avg. channel open time | < 30 s | ---> FIX
| Support | Avg. resolution time | < 24 h |

### 6. Functional Requirements
| ID | Requirement | Description | Priority |
| FR‑001 | Breez SDK Implementation | Proper usage of the Breez SDK for Bitcoin Lightning usage | Must |
| FR‑002 | Invoice Handling | Create, sign, and broadcast Lightning invoices. | Must |
| FR‑003 | Send via onchain and LNURL | Ability to send Bitcoin onchain and via LNURL | Must |
| FR‑004 | Payment Execution | Send payments via channel, support fee estimation. | Must |
| FR‑005 | Balance Overview | UI to show on‑chain and channel balances. | Must |
| FR‑006 | Transaction History | List on‑chain and Lightning transactions. | Should |
| FR‑007 | Backup & Restore | Encrypt & allow seed export/import. | Should |
| FR‑008 | Security Alerts | Warn of unconfirmed channels or large balances. | Should |
| FR‑009 | Support for Testnet | Ability to switch network for testing. | Should |

### 7. Non‑Functional Requirements
| Category | Requirement | Description |
| Performance | Response time | UI updates < 500 ms; channel open < 30 s |
| Reliability | Up‑time | 99.5 % uptime for daemon services |
| Scalability | User concurrency | 1 k concurrent users without degradation |
| Security | Data at rest | AES‑256 encryption of keys and DB |
| Security | Data in transit | TLS 1.3 for all APIs |
| Compliance | KYC/AML - None | Metadata for anti‑money‑laundering monitoring is not needed |
| Privacy | GDPR | All Transactional data and keys will reside on the device only |

### 8. Constraints
| Constraint | Impact |
| Technology Stack | Must use web‑based front end (React/Electron) and Breez SDK. |
| Development Platform | Expo for deployment of the application. |
| Regulatory | Must adhere to local financial regulations regarding crypto holdings and payments. |
| Device | Mobile phones (iOS/Android), not desktop |

### 9. Assumptions
Assumption	Rationale
Users have stable internet connectivity	Needed for channel management and payment routing.
Users can run a Lightning node locally or connect to a remote node	Simplifies design by abstracting full node setup.
Initial launch focuses on the Bitcoin testnet	Allows rapid iteration without real‑money risk.

### 10. Acceptance Criteria
For each functional requirement, a set of Definition of Done (DoD) items and acceptance tests will be created in the sprint backlog. E.g.:

FR‑001 – “Given a lightning channel, when the system is started, the user can open, close, and view a channel using a simple user interface.”
FR‑003 – “Given an unfunded channel request, when the user approves, the channel opens in under 30 s and appears in the Channel list.”

### 11. Deliverables
Documentation – BRS, Use‑Case diagrams, API specification (openapi.yaml).
Prototype – Working wallet with core features on testnet.
Test Plan – Unit, integration, and acceptance test scripts.
Release Notes – For each version update.

### 12. Sign‑off
| Role | Name | Signature | Date |
| Product Owner | Wave.Space |   | 1/23/2026  |
| Engineering Lead | MAB  |   | 1/23/2026  |
| QA Lead |  |   |   |
| Legal/Compliance |   |   |   |		
Prepared by: ___________________________

Approved by: ____________________________

