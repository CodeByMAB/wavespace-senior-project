import type {Transaction} from '@/types/wallet';

const now = Date.now() / 1000;
const HOUR = 3600;
const DAY = 86400;

export const mockTransactions: Transaction[] = [
  {
    id: 'tx_001',
    type: 'received',
    status: 'completed',
    amountSats: 50000,
    feeSats: 0,
    timestamp: now - HOUR * 2,
    description: 'Payment from Alice',
    paymentHash:
      'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  },
  {
    id: 'tx_002',
    type: 'sent',
    status: 'completed',
    amountSats: 25000,
    feeSats: 12,
    timestamp: now - HOUR * 5,
    description: 'Coffee payment',
    paymentHash:
      'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
  },
  {
    id: 'tx_003',
    type: 'received',
    status: 'completed',
    amountSats: 100000,
    feeSats: 0,
    timestamp: now - DAY,
    description: 'Invoice payment',
    paymentHash:
      'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
  },
  {
    id: 'tx_004',
    type: 'sent',
    status: 'completed',
    amountSats: 10000,
    feeSats: 5,
    timestamp: now - DAY * 2,
    description: 'Donation',
    paymentHash:
      'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
  },
  {
    id: 'tx_005',
    type: 'pending_receive',
    status: 'pending',
    amountSats: 75000,
    feeSats: 0,
    timestamp: now - 300,
    description: 'Pending incoming payment',
  },
  {
    id: 'tx_006',
    type: 'received',
    status: 'completed',
    amountSats: 200000,
    feeSats: 0,
    timestamp: now - DAY * 3,
    description: 'Payment from Bob',
    paymentHash:
      'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
  },
  {
    id: 'tx_007',
    type: 'sent',
    status: 'failed',
    amountSats: 500000,
    feeSats: 0,
    timestamp: now - DAY * 4,
    description: 'Failed route - no path found',
  },
  {
    id: 'tx_008',
    type: 'sent',
    status: 'completed',
    amountSats: 15000,
    feeSats: 8,
    timestamp: now - DAY * 7,
    description: 'Weekly subscription',
    paymentHash:
      'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
  },
];
