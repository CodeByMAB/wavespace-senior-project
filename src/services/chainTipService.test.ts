import {afterEach, describe, expect, it, vi} from 'vitest';
import {fetchMainnetTipHeight} from './chainTipService';

describe('chainTipService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed height from plain-text response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('902000'),
      }),
    );
    await expect(fetchMainnetTipHeight()).resolves.toBe(902000);
  });

  it('returns null on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve(''),
      }),
    );
    await expect(fetchMainnetTipHeight()).resolves.toBeNull();
  });

  it('returns null on invalid body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('not-a-number'),
      }),
    );
    await expect(fetchMainnetTipHeight()).resolves.toBeNull();
  });
});
