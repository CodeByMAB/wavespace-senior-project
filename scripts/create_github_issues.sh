#!/bin/bash
#
# Create 11 GitHub Issues for Epic: Breez SDK Integration for Expo App
# Run from repo root. Requires: gh auth login (authenticated).
# Usage: ./scripts/create_github_issues.sh
#

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
BODIES_DIR="$REPO_ROOT/scripts/github-issues"

EPIC_ID="97fd7dcb-10ec-46a8-b681-b2805eb0eb56"
SPEC_ID="a8f8bef7-d1c5-4113-a9ad-6092120bfe76"

# Ticket data: title|labels|body_file
declare -a TICKETS=(
  "Setup Expo Project with Breez SDK Integration|foundation,enhancement,dependencies|01-setup-expo.md"
  "Implement Wallet Creation and Restoration|core-feature,security,enhancement|02-wallet-creation-restoration.md"
  "Initialize Breez SDK and Lightning Node|core-feature,integration,enhancement|03-initialize-breez-sdk.md"
  "Implement Lightning Payment Operations|core-feature,enhancement,payments|04-lightning-payment-operations.md"
  "Implement Withdrawal to External Bitcoin Address|core-feature,enhancement,payments|05-withdrawal-external-bitcoin.md"
  "Implement Dashboard and Transaction History|core-feature,enhancement,ui|06-dashboard-transaction-history.md"
  "Implement Channel Management and Monitoring|core-feature,enhancement,lightning|07-channel-management.md"
  "Implement Settings and Configuration|core-feature,enhancement,configuration|08-settings-configuration.md"
  "Implement QR Code Scanning and Generation|core-feature,enhancement,ui|09-qr-scanning-generation.md"
  "Implement Testing Suite and Quality Assurance|testing,quality-assurance,enhancement|10-testing-qa.md"
  "Prepare for App Store Deployment|deployment,documentation,enhancement|11-app-store-deployment.md"
)

# Ensure required labels exist (create if missing)
ensure_labels() {
  local labels=(
    "foundation"
    "enhancement"
    "dependencies"
    "core-feature"
    "security"
    "integration"
    "payments"
    "ui"
    "lightning"
    "configuration"
    "testing"
    "quality-assurance"
    "deployment"
    "documentation"
  )
  for label in "${labels[@]}"; do
    if ! gh label list --limit 1000 2>/dev/null | grep -q "^${label}[[:space:]]"; then
      echo "Creating label: $label"
      gh label create "$label" --color "ededed" --description "" 2>/dev/null || true
    fi
  done
}

echo "=== Creating GitHub Issues for Breez SDK Integration Epic ==="
echo "Repo: $(git rev-parse --show-toplevel)"
echo ""

# Verify gh is authenticated
if ! gh auth status 2>/dev/null; then
  echo "Error: GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

# Create labels if needed
echo "Ensuring labels exist..."
ensure_labels
echo ""

# Create issues in order
for i in "${!TICKETS[@]}"; do
  IFS='|' read -r title labels body_file <<< "${TICKETS[$i]}"
  body_path="$BODIES_DIR/$body_file"
  if [[ ! -f "$body_path" ]]; then
    echo "Error: Body file not found: $body_path"
    exit 1
  fi
  echo "Creating issue $((i+1))/11: $title"
  issue_url=$(gh issue create \
    --title "$title" \
    --body-file "$body_path" \
    --label "$labels")
  echo "  Created: $issue_url"
done

echo ""
echo "=== Summary ==="
gh issue list --limit 11 --state open --json number,title,url --jq '.[] | "#\(.number): \(.title)\n  URL: \(.url)"' 2>/dev/null || true
echo ""
echo "Done. All 11 issues created."
