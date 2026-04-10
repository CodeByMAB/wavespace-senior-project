import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  btcToSats,
  formatAmount,
  formatBtc,
  formatSats,
  formatTime,
  formatTimestamp,
  getDateGroup,
  satsToBtc,
  satsToFiat,
  truncateMiddle,
} from './formatters';

vi.mock('@services/priceService', () => ({
  getCachedBtcPriceUsd: vi.fn(() => 50_000),
}));

describe('formatters', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('satsToBtc', () => {
    expect(satsToBtc(100_000_000)).toBe(1);
    expect(satsToBtc(1)).toBe(0.00000001);
    expect(satsToBtc(0)).toBe(0);
  });

  it('btcToSats', () => {
    expect(btcToSats(1)).toBe(100_000_000);
    expect(btcToSats(0.5)).toBe(50_000_000);
  });

  it('formatSats', () => {
    expect(formatSats(1000)).toBe('1,000');
    expect(formatSats(0)).toBe('0');
  });

  it('formatBtc', () => {
    expect(formatBtc(100_000_000)).toBe('1.00000000');
  });

  it('formatAmount with sats', () => {
    expect(formatAmount(1000, 'sats')).toContain('sats');
  });

  it('formatAmount with btc', () => {
    expect(formatAmount(100_000_000, 'btc')).toContain('BTC');
  });

  it('satsToFiat uses mocked BTC price', () => {
    expect(satsToFiat(100_000_000)).toBe('$50000.00');
  });

  it('truncateMiddle leaves short strings unchanged', () => {
    expect(truncateMiddle('short')).toBe('short');
  });

  it('truncateMiddle inserts ellipsis for long strings', () => {
    const long = 'a'.repeat(40);
    const out = truncateMiddle(long, 4, 4);
    expect(out).toContain('...');
    expect(out.length).toBeLessThan(long.length);
  });

  describe('formatTimestamp', () => {
    it('formats recent times as minutes or hours ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
      const fiveMinAgo = Math.floor(
        (Date.now() - 5 * 60 * 1000) / 1000,
      );
      expect(formatTimestamp(fiveMinAgo)).toMatch(/\d+m ago/);
      const twoHoursAgo = Math.floor(
        (Date.now() - 2 * 60 * 60 * 1000) / 1000,
      );
      expect(formatTimestamp(twoHoursAgo)).toMatch(/\d+h ago/);
    });

    it('formats old timestamps as locale date string', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
      const oldUnix = Math.floor(
        new Date('2026-01-01T00:00:00.000Z').getTime() / 1000,
      );
      const s = formatTimestamp(oldUnix);
      expect(s).not.toMatch(/ago$/);
      expect(s.length).toBeGreaterThan(0);
    });
  });

  describe('getDateGroup', () => {
    it('returns Today for today', () => {
      vi.useFakeTimers();
      const now = new Date('2026-04-09T15:30:00.000Z');
      vi.setSystemTime(now);
      const unix = Math.floor(now.getTime() / 1000);
      expect(getDateGroup(unix)).toBe('Today');
    });

    it('returns Yesterday for yesterday', () => {
      vi.useFakeTimers();
      const now = new Date('2026-04-09T12:00:00.000Z');
      vi.setSystemTime(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const unix = Math.floor(yesterday.getTime() / 1000);
      expect(getDateGroup(unix)).toBe('Yesterday');
    });

    it('returns a longer locale string for older dates', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));
      const unix = Math.floor(
        new Date('2025-06-01T12:00:00.000Z').getTime() / 1000,
      );
      const g = getDateGroup(unix);
      expect(g).not.toBe('Today');
      expect(g).not.toBe('Yesterday');
      expect(g.length).toBeGreaterThan(3);
    });
  });

  it('formatTime matches 12-hour clock pattern', () => {
    const s = formatTime(Math.floor(Date.now() / 1000));
    expect(s).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
  });
});
