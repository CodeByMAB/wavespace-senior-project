import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

describe('priceService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('successful fetch returns parsed USD price', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { amount: '50000.5' } }),
    });
    const { getBtcPriceUsd } = await import('./priceService');
    await expect(getBtcPriceUsd()).resolves.toBe(50000.5);
  });

  it('cache hit within TTL returns cached value without re-fetching', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { amount: '42000' } }),
    });
    vi.setSystemTime(1_000_000);
    const { getBtcPriceUsd } = await import('./priceService');
    await getBtcPriceUsd();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.setSystemTime(1_000_000 + 30_000);
    await getBtcPriceUsd();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cache miss after TTL re-fetches', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { amount: '41000' } }),
    });
    vi.setSystemTime(2_000_000);
    const { getBtcPriceUsd } = await import('./priceService');
    await getBtcPriceUsd();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.setSystemTime(2_000_000 + 61_000);
    await getBtcPriceUsd();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('non-OK HTTP response returns cached value (0 on first call)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });
    const { getBtcPriceUsd } = await import('./priceService');
    await expect(getBtcPriceUsd()).resolves.toBe(0);
  });

  it('malformed JSON body returns cached value gracefully', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('bad json');
      },
    });
    const { getBtcPriceUsd } = await import('./priceService');
    await expect(getBtcPriceUsd()).resolves.toBe(0);
  });

  it('getCachedBtcPriceUsd reflects module cache after fetch', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { amount: '33333' } }),
    });
    const mod = await import('./priceService');
    await mod.getBtcPriceUsd();
    expect(mod.getCachedBtcPriceUsd()).toBe(33333);
  });
});
