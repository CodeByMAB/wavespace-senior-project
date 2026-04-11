// expo-secure-store keys (hardware-backed encrypted storage)
export const SECURE_KEYS = {
  MNEMONIC_KEY: 'wavespace_mnemonic',
  /** Legacy: OS biometric required to read key material (caused Face ID after PIN unlock). */
  MNEMONIC_ENC_KEY: 'wavespace_mnemonic_enc_key',
  /** Current: key readable when device is unlocked; app PIN is the primary gate. */
  MNEMONIC_ENC_KEY_V2: 'wavespace_mnemonic_enc_key_v2',
  PASSPHRASE_KEY: 'wavespace_passphrase',
  PIN_HASH_KEY: 'wavespace_pin_hash',
  WALLET_METADATA_KEY: 'wavespace_wallet_metadata',
} as const;

// AsyncStorage keys (non-sensitive persistent state)
export const ASYNC_KEYS = {
  ONBOARDING_COMPLETED: 'wavespace_onboarding_completed',
  /** Legacy key; normalized to `mainnet` on settings load (app is mainnet-only). */
  NETWORK_SELECTION: 'wavespace_network_selection',
  /** Auto-lock timeout in seconds; `0` = never (only used when {@link LOCK_ON_BACKGROUND} is off). */
  AUTO_LOCK_TIMEOUT: 'wavespace_auto_lock_timeout',
  /** When `true`, require PIN/biometrics when returning after the app goes to background. */
  LOCK_ON_BACKGROUND: 'wavespace_lock_on_background',
  /** Display unit: `sats` | `btc`. */
  DISPLAY_UNIT: 'wavespace_display_unit',
  /** Security: warn on large balance (boolean as `true`/`false`). */
  SECURITY_ALERT_LARGE_BALANCE: 'wavespace_security_alert_large_balance',
  /** Security: warn on unconfirmed / pending activity. */
  SECURITY_ALERT_UNCONFIRMED_TX: 'wavespace_security_alert_unconfirmed_tx',
  USER_PREFERENCES: 'wavespace_user_preferences',
  /** Base id; use {@link nodeStateCacheKey} for the mainnet node snapshot key. */
  NODE_STATE_CACHE: 'wavespace_node_state_cache',
  /** PIN rate-limit / lockout metadata (failedAttempts, lockoutUntil timestamp). */
  AUTH_LOCKOUT_METADATA: 'wavespace_auth_lockout_metadata',
} as const;

/** AsyncStorage key for last-known mainnet node state snapshot. */
export function nodeStateCacheKey(): string {
  return `${ASYNC_KEYS.NODE_STATE_CACHE}_mainnet`;
}
