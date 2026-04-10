#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install from https://docs.maestro.dev/getting-started/installing-maestro" >&2
  exit 1
fi
maestro test \
  "$ROOT/maestro/critical_01_app_launch.yaml" \
  "$ROOT/maestro/critical_02_sdk_wallet_connection.yaml" \
  "$ROOT/maestro/critical_03_payment_send_lifecycle.yaml" \
  "$ROOT/maestro/critical_04_storage_network_transition.yaml" \
  "$ROOT/maestro/critical_05_wallet_recovery_mnemonic.yaml" \
  "$ROOT/maestro/critical_06_receive_payment.yaml"
