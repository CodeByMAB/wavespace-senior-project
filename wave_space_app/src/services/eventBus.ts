/**
 * Lightweight typed event bus for propagating Breez SDK events to the UI.
 *
 * Components subscribe to specific event names. The WalletContext bridges
 * Breez SDK events into this bus so any screen can react to changes.
 */

type Listener<T = unknown> = (data: T) => void;

const listeners = new Map<string, Set<Listener>>();

export function emit<T = unknown>(event: string, data: T): void {
  const set = listeners.get(event);
  if (!set) {return;}
  for (const fn of set) {
    try {
      fn(data);
    } catch (_) {
      // Don't let one bad listener break others
    }
  }
}

export function on<T = unknown>(event: string, fn: Listener<T>): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(fn as Listener);
  return () => {
    set!.delete(fn as Listener);
    if (set!.size === 0) {
      listeners.delete(event);
    }
  };
}

// Well-known event names used across the app
export const Events = {
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_SENT: 'payment_sent',
  PAYMENT_FAILED: 'payment_failed',
  NODE_STATE_CHANGED: 'node_state_changed',
  SYNC_COMPLETE: 'sync_complete',
  BACKUP_NEEDED: 'backup_needed',
} as const;
