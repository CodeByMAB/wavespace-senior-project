// expo-secure-store keys (hardware-backed encrypted storage)
export const SECURE_KEYS = {
  MNEMONIC_KEY: 'wavespace_mnemonic',
  MNEMONIC_ENC_KEY: 'wavespace_mnemonic_enc_key',
  PASSPHRASE_KEY: 'wavespace_passphrase',
  PIN_HASH_KEY: 'wavespace_pin_hash',
  WALLET_METADATA_KEY: 'wavespace_wallet_metadata',
} as const;

// AsyncStorage keys (non-sensitive persistent state)
export const ASYNC_KEYS = {
  ONBOARDING_COMPLETED: 'wavespace_onboarding_completed',
  NETWORK_SELECTION: 'wavespace_network_selection',
  /** Auto-lock timeout in seconds; `0` = never. */
  AUTO_LOCK_TIMEOUT: 'wavespace_auto_lock_timeout',
  /** Display unit: `sats` | `btc` | `both`. */
  DISPLAY_UNIT: 'wavespace_display_unit',
  /** Security: warn on large balance (boolean as `true`/`false`). */
  SECURITY_ALERT_LARGE_BALANCE: 'wavespace_security_alert_large_balance',
  /** Security: warn on unconfirmed / pending activity. */
  SECURITY_ALERT_UNCONFIRMED_TX: 'wavespace_security_alert_unconfirmed_tx',
  USER_PREFERENCES: 'wavespace_user_preferences',
  /** Base id; use {@link nodeStateCacheKey} so each network has an isolated snapshot. */
  NODE_STATE_CACHE: 'wavespace_node_state_cache',
  /** PIN rate-limit / lockout metadata (failedAttempts, lockoutUntil timestamp). */
  AUTH_LOCKOUT_METADATA: 'wavespace_auth_lockout_metadata',
} as const;

/** AsyncStorage key for last-known node state for a single network (mainnet vs testnet). */
export function nodeStateCacheKey(network: 'mainnet' | 'testnet'): string {
  return `${ASYNC_KEYS.NODE_STATE_CACHE}_${network}`;
}
