/**
 * Breez SDK (Greenlight) configuration for Wavespace.
 *
 * IMPORTANT: Before running the app you must:
 * 1. Get a Breez API key from https://breez.technology
 * 2. Get a Greenlight invite code from https://bit.ly/glInvites
 * 3. Set both below.
 */

import {
  EnvironmentType,
  NodeConfigVariant,
  Network,
} from '@breeztech/react-native-breez-sdk';

// Replace with your real Breez API key
export const BREEZ_API_KEY = 'MIIBbjCCASCgAwIBAgIHPxXK51DK6zAFBgMrZXAwEDEOMAwGA1UEAxMFQnJlZXowHhcNMjYwNDA4MjI0NzU0WhcNMzYwNDA1MjI0NzU0WjAkMRQwEgYDVQQKEws4YXNlIDBmIDBwczEMMAoGA1UEAxMDTUFCMCowBQYDK2VwAyEA0IP1y98gPByiIMoph1P0G6cctLb864rNXw1LRLOpXXejgYQwgYEwDgYDVR0PAQH/BAQDAgWgMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFNo5o+5ea0sNMlW/75VgGJCv2AcJMB8GA1UdIwQYMBaAFN6q1pJW843ndJIW/Ey2ILJrKJhrMCEGA1UdEQQaMBiBFk1BQkNvZGVAcHJvdG9ubWFpbC5jb20wBQYDK2VwA0EAQIa6xgbHKrjuTKhQ/ceolMMNc9nieoqyVUIHqTOfS4R3foP1ohIoD0ulYibRT2tPAq7ALeUsiB59B3qqoKtuCA==';

export const BREEZ_NETWORK = Network.TESTNET;
export const BREEZ_ENVIRONMENT = EnvironmentType.PRODUCTION;

// Get a Greenlight invite code at https://bit.ly/glInvites
// Paste your invite code below. Leave as empty string until you have one.
export const GREENLIGHT_INVITE_CODE = '';

export const NODE_CONFIG = {
  type: NodeConfigVariant.GREENLIGHT as const,
  config: {
    partnerCredentials: undefined as any,
    inviteCode: GREENLIGHT_INVITE_CODE || undefined,
  },
};
