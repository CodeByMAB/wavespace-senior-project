import type {Channel} from '@/types/wallet';

export const mockChannels: Channel[] = [
  {
    id: 'ch_001',
    remotePubkey:
      '03a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
    remoteAlias: 'ACINQ',
    capacitySats: 2000000,
    localBalanceSats: 1200000,
    remoteBalanceSats: 800000,
    state: 'active',
    isUsable: true,
    shortChannelId: '800000x1234x0',
  },
  {
    id: 'ch_002',
    remotePubkey:
      '02b2c3d4e5f67890123456789012345678901234567890123456789012345678901a',
    remoteAlias: 'Breez LSP',
    capacitySats: 5000000,
    localBalanceSats: 300000,
    remoteBalanceSats: 4700000,
    state: 'active',
    isUsable: true,
    shortChannelId: '800000x5678x1',
  },
  {
    id: 'ch_003',
    remotePubkey:
      '03c3d4e5f6789012345678901234567890123456789012345678901234567890123b',
    remoteAlias: 'Unknown Node',
    capacitySats: 1000000,
    localBalanceSats: 0,
    remoteBalanceSats: 1000000,
    state: 'inactive',
    isUsable: false,
    shortChannelId: '790000x9012x2',
  },
  {
    id: 'ch_004',
    remotePubkey:
      '02d4e5f678901234567890123456789012345678901234567890123456789012345c',
    remoteAlias: undefined,
    capacitySats: 3000000,
    localBalanceSats: 1500000,
    remoteBalanceSats: 1500000,
    state: 'pending_open',
    isUsable: false,
  },
];
