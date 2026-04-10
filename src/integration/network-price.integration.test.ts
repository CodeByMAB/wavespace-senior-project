import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('integration: network price service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('fetches BTC/USD, uses TTL cache, keeps last value on failed refresh', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { getBtcPriceUsd } = await import('@services/priceService');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { amount: '42000.5' } }),
    });
    const first = await getBtcPriceUsd();
    expect(first).toBe(42000.5);
    const second = await getBtcPriceUsd();
    expect(second).toBe(42000.5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    const third = await getBtcPriceUsd();
    expect(third).toBe(42000.5);
  });
});
