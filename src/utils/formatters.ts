import type {DisplayUnit} from '@/types/wallet';
import {getCachedBtcPriceUsd} from '@services/priceService';

export function satsToBtc(sats: number): number {
  return sats / 100_000_000;
}

export function btcToSats(btc: number): number {
  return Math.round(btc * 100_000_000);
}

export function formatSats(sats: number): string {
  return Math.abs(sats).toLocaleString('en-US');
}

export function formatBtc(sats: number): string {
  return satsToBtc(Math.abs(sats)).toFixed(8);
}

export function formatAmount(sats: number, unit: DisplayUnit): string {
  if (unit === 'btc') {
    return `${formatBtc(sats)} BTC`;
  }
  return `${formatSats(sats)} sats`;
}

export function satsToFiat(sats: number): string {
  const usd = satsToBtc(Math.abs(sats)) * getCachedBtcPriceUsd();
  return `$${usd.toFixed(2)}`;
}

export function truncateMiddle(
  str: string,
  startChars = 8,
  endChars = 8,
): string {
  if (str.length <= startChars + endChars + 3) {
    return str;
  }
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
}

export function formatTimestamp(unix: number): string {
  const date = new Date(unix * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    return `${Math.max(1, Math.floor(diffMs / 60000))}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  if (diffHours < 48) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

export function getDateGroup(unix: number): string {
  const date = new Date(unix * 1000);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return 'Today';
  }
  if (isYesterday) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(unix: number): string {
  const date = new Date(unix * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
