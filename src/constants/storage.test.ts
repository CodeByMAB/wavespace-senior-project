import {describe, expect, it} from 'vitest';
import {ASYNC_KEYS, nodeStateCacheKey, SECURE_KEYS} from './storage';

describe('storage constants', () => {
  it('SECURE_KEYS values are unique', () => {
    const values = Object.values(SECURE_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('ASYNC_KEYS values are unique', () => {
    const values = Object.values(ASYNC_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('nodeStateCacheKey is stable mainnet snapshot key', () => {
    expect(nodeStateCacheKey()).toContain('mainnet');
    expect(nodeStateCacheKey()).toBe(nodeStateCacheKey());
  });
});
