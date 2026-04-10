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

  it('nodeStateCacheKey(mainnet) includes mainnet', () => {
    expect(nodeStateCacheKey('mainnet')).toContain('mainnet');
  });

  it('nodeStateCacheKey(testnet) includes testnet', () => {
    expect(nodeStateCacheKey('testnet')).toContain('testnet');
  });

  it('mainnet and testnet cache keys differ', () => {
    expect(nodeStateCacheKey('mainnet')).not.toBe(nodeStateCacheKey('testnet'));
  });
});
