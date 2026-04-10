import {beforeEach, describe, expect, it, vi} from 'vitest';

describe('eventBus', () => {
  let emit: typeof import('./eventBus').emit;
  let on: typeof import('./eventBus').on;
  let Events: typeof import('./eventBus').Events;

  beforeEach(async () => {
    vi.resetModules();
    const m = await import('./eventBus');
    emit = m.emit;
    on = m.on;
    Events = m.Events;
  });

  it('on + emit delivers data to the listener', () => {
    const fn = vi.fn();
    on('test_event', fn);
    emit('test_event', {x: 1});
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({x: 1});
  });

  it('multiple listeners on the same event all fire', () => {
    const a = vi.fn();
    const b = vi.fn();
    on('multi', a);
    on('multi', b);
    emit('multi', 42);
    expect(a).toHaveBeenCalledWith(42);
    expect(b).toHaveBeenCalledWith(42);
  });

  it('unsubscribe stops further delivery', () => {
    const fn = vi.fn();
    const off = on('off_me', fn);
    emit('off_me', 1);
    off();
    emit('off_me', 2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('a listener that throws does not prevent other listeners', () => {
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    on('boom', bad);
    on('boom', good);
    expect(() => emit('boom', undefined)).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });

  it('emit with no listeners does not throw', () => {
    expect(() => emit('nothing_listening', {k: 'v'})).not.toThrow();
  });

  it('Events constant values are unique strings', () => {
    const values = Object.values(Events);
    expect(new Set(values).size).toBe(values.length);
    for (const v of values) {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    }
  });
});
