# GitHub Issues – Breez SDK Integration Epic

This folder contains the body content for 11 GitHub Issues that implement the plan for **Epic: Breez SDK Integration for Expo App** (`epic:97fd7dcb-10ec-46a8-b681-b2805eb0eb56`).

## Issue order and files

| # | Title | Body file | Labels |
|---|--------|-----------|--------|
| 1 | Setup Expo Project with Breez SDK Integration | `01-setup-expo.md` | foundation, enhancement, dependencies |
| 2 | Implement Wallet Creation and Restoration | `02-wallet-creation-restoration.md` | core-feature, security, enhancement |
| 3 | Initialize Breez SDK and Lightning Node | `03-initialize-breez-sdk.md` | core-feature, integration, enhancement |
| 4 | Implement Lightning Payment Operations | `04-lightning-payment-operations.md` | core-feature, enhancement, payments |
| 5 | Implement Withdrawal to External Bitcoin Address | `05-withdrawal-external-bitcoin.md` | core-feature, enhancement, payments |
| 6 | Implement Dashboard and Transaction History | `06-dashboard-transaction-history.md` | core-feature, enhancement, ui |
| 7 | Implement Channel Management and Monitoring | `07-channel-management.md` | core-feature, enhancement, lightning |
| 8 | Implement Settings and Configuration | `08-settings-configuration.md` | core-feature, enhancement, configuration |
| 9 | Implement QR Code Scanning and Generation | `09-qr-scanning-generation.md` | core-feature, enhancement, ui |
| 10 | Implement Testing Suite and Quality Assurance | `10-testing-qa.md` | testing, quality-assurance, enhancement |
| 11 | Prepare for App Store Deployment | `11-app-store-deployment.md` | deployment, documentation, enhancement |

## Creating the issues

From the repository root:

1. **Authenticate GitHub CLI** (if not already):
   ```bash
   gh auth login
   ```
2. **Run the automation script**:
   ```bash
   ./scripts/create_github_issues.sh
   ```

The script will create any missing labels, then create all 11 issues in dependency order and print a summary with issue numbers and URLs.

## After creation

- Generate a summary report:
  ```bash
  gh issue list --limit 11 --json number,title,url --jq '.[] | "#\(.number): \(.title)\n  URL: \(.url)"'
  ```
- Optionally: create a GitHub Project board, add issues to columns (Todo, In Progress, Review, Done), and configure issue templates or GitHub Actions as in the plan.
