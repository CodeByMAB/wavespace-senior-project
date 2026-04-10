/**
 * Breez SDK (Greenlight) service layer.
 *
 * Wraps the Breez SDK for Lightning operations on testnet.
 * All amounts inside the SDK are in millisatoshis (msat).
 * This module converts to/from satoshis at the boundary.
 */

import {
  connect,
  defaultConfig,
  mnemonicToSeed,
  nodeInfo,
  sendPayment as sdkSendPayment,
  receivePayment,
  listPayments as sdkListPayments,
  disconnect as sdkDisconnect,
  BreezEventVariant,
  PaymentType,
  PaymentStatus,
  PaymentDetailsVariant,
  type BreezEvent,
  type Payment,
  type NodeState,
  type ConnectRequest,
} from '@breeztech/react-native-breez-sdk';

import * as FileSystem from 'expo-file-system';
import type {
  Transaction,
  Channel,
  WalletBalance,
  TransactionType,
  TransactionStatus,
} from '@/types/wallet';
import {
  BREEZ_API_KEY,
  BREEZ_ENVIRONMENT,
  BREEZ_NETWORK,
  NODE_CONFIG,
  GREENLIGHT_INVITE_CODE,
} from '@/config/breez';

export type ConnectionStatus = 'connected' | 'disconnected' | 'syncing';

export interface AppNodeState {
  nodeId: string;
  blockHeight: number;
  balance: WalletBalance;
  connectionStatus: ConnectionStatus;
}

// --- SDK Lifecycle ---

let _initialized = false;
let _subscription: {remove: () => void} | null = null;

type AppEventCallback = (event: BreezEvent) => void;
let _eventCallback: AppEventCallback | null = null;

/**
 * Set a callback that will be forwarded all Breez SDK events.
 * Call before `initBreezSdk` so the listener is registered on connect.
 */
export function setEventCallback(cb: AppEventCallback | null): void {
  _eventCallback = cb;
}

export async function initBreezSdk(mnemonic: string): Promise<void> {
  if (_initialized) {return;}

  // Pre-flight checks
  if (!GREENLIGHT_INVITE_CODE && !NODE_CONFIG.config.partnerCredentials) {
    throw new Error(
      'Greenlight invite code required.\n\n' +
      'Get one at https://bit.ly/glInvites then paste it in src/config/breez.ts',
    );
  }

  // Derive seed from mnemonic
  const seed = await mnemonicToSeed(mnemonic);

  // Ensure working directory exists.
  // FileSystem.documentDirectory is a file:// URL — the SDK needs a plain path.
  const docDir = FileSystem.documentDirectory ?? '';
  const workingDirUri = `${docDir}breez_sdk`;
  const dirInfo = await FileSystem.getInfoAsync(workingDirUri);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(workingDirUri, {intermediates: true});
  }
  const workingDir = workingDirUri.replace(/^file:\/\//, '');

  // Build config
  const config = await defaultConfig(BREEZ_ENVIRONMENT, BREEZ_API_KEY, NODE_CONFIG);
  config.workingDir = workingDir;
  config.network = BREEZ_NETWORK;

  // Build connect request
  const connectRequest: ConnectRequest = {config, seed};

  // Connect to Greenlight node — the listener receives SDK events
  _subscription = await connect(connectRequest, (event: BreezEvent) => {
    _eventCallback?.(event);
  });
  _initialized = true;
}

export function isInitialized(): boolean {
  return _initialized;
}

export async function disconnectBreezSdk(): Promise<void> {
  if (!_initialized) {return;}
  _subscription?.remove();
  _subscription = null;
  await sdkDisconnect();
  _initialized = false;
}

// --- Node State ---

export async function getNodeState(): Promise<AppNodeState> {
  const info: NodeState = await nodeInfo();

  const lightningBalanceSats = Math.floor(info.channelsBalanceMsat / 1000);
  const inboundSats = Math.floor(info.totalInboundLiquidityMsats / 1000);
  const onchainConfirmedSats = Math.floor(info.onchainBalanceMsat / 1000);
  const onchainPendingSats = Math.floor(info.pendingOnchainBalanceMsat / 1000);

  return {
    nodeId: info.id,
    blockHeight: info.blockHeight,
    balance: {
      onchainConfirmedSats,
      onchainPendingSats,
      lightningBalanceSats,
      inboundLiquiditySats: inboundSats,
      outboundLiquiditySats: lightningBalanceSats,
      totalBalanceSats: onchainConfirmedSats + lightningBalanceSats,
    },
    connectionStatus: 'connected',
  };
}

// --- Payments ---

export async function sendPayment(
  bolt11: string,
  amountSats?: number,
): Promise<Transaction> {
  const amountMsat = amountSats ? amountSats * 1000 : undefined;
  const result = await sdkSendPayment({
    bolt11,
    useTrampoline: true,
    amountMsat,
  });
  return mapPaymentToTransaction(result.payment);
}

export async function createInvoice(
  amountSats: number,
  description?: string,
): Promise<string> {
  const response = await receivePayment({
    amountMsat: amountSats * 1000,
    description: description ?? '',
  });
  return response.lnInvoice.bolt11;
}

export async function withdrawOnchain(
  _address: string,
  _amountSats: number,
  _feeRate: number,
): Promise<Transaction> {
  // Breez SDK supports on-chain via reverse swaps:
  //   import { sendOnchain, fetchReverseSwapFees } from '@breeztech/react-native-breez-sdk';
  //   const fees = await fetchReverseSwapFees({sendAmountSat: amountSats});
  //   const result = await sendOnchain({amountSat, onchainRecipientAddress, ...fees});
  // Implement once you've tested the reverse swap flow on testnet.
  throw new Error(
    'On-chain withdrawals via reverse swap not yet implemented — see TODO in breezService.ts',
  );
}

// --- Transaction History ---

export async function listPayments(): Promise<Transaction[]> {
  const payments = await sdkListPayments({});
  return payments.map(mapPaymentToTransaction);
}

// --- Channels ---

export async function listChannels(): Promise<Channel[]> {
  // Breez SDK manages channels internally via Greenlight.
  // Return a synthetic entry representing overall Lightning state.
  const info = await nodeInfo();
  const localSats = Math.floor(info.channelsBalanceMsat / 1000);
  const remoteSats = Math.floor(info.totalInboundLiquidityMsats / 1000);

  if (localSats === 0 && remoteSats === 0) {
    return [];
  }

  return [
    {
      id: 'greenlight-aggregate',
      remotePubkey: info.id,
      remoteAlias: 'Greenlight',
      capacitySats: localSats + remoteSats,
      localBalanceSats: localSats,
      remoteBalanceSats: remoteSats,
      state: 'active',
      isUsable: true,
    },
  ];
}

// --- Payment → Transaction mapping ---

function mapPaymentToTransaction(payment: Payment): Transaction {
  const amountSats = Math.floor(payment.amountMsat / 1000);
  const feeSats = Math.floor(payment.feeMsat / 1000);

  let type: TransactionType;
  if (payment.paymentType === PaymentType.SENT) {
    type = payment.status === PaymentStatus.PENDING ? 'pending_send' : 'sent';
  } else {
    type = payment.status === PaymentStatus.PENDING ? 'pending_receive' : 'received';
  }

  let status: TransactionStatus;
  switch (payment.status) {
    case PaymentStatus.COMPLETE:
      status = 'completed';
      break;
    case PaymentStatus.PENDING:
      status = 'pending';
      break;
    case PaymentStatus.FAILED:
      status = 'failed';
      break;
    default:
      status = 'completed';
  }

  // Extract Lightning-specific details
  let paymentHash: string | undefined;
  let preimage: string | undefined;
  let bolt11: string | undefined;
  let destination: string | undefined;

  if (payment.details.type === PaymentDetailsVariant.LN) {
    const ln = payment.details.data;
    paymentHash = ln.paymentHash;
    preimage = ln.paymentPreimage || undefined;
    bolt11 = ln.bolt11 || undefined;
    destination = ln.destinationPubkey || undefined;
  } else if (payment.details.type === PaymentDetailsVariant.CLOSED_CHANNEL) {
    const cc = payment.details.data;
    destination = cc.closingTxid || undefined;
  }

  return {
    id: payment.id,
    type,
    status,
    amountSats,
    feeSats,
    timestamp: payment.paymentTime,
    description: payment.description || undefined,
    paymentHash,
    preimage,
    destination,
    bolt11,
  };
}
