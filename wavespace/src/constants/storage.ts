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
  USER_PREFERENCES: 'wavespace_user_preferences',
} as const;
