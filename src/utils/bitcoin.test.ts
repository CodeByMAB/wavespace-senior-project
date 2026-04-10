import {describe, expect, it} from 'vitest';
import {detectPaymentType, parseBitcoinDestination} from './bitcoin';

describe('detectPaymentType', () => {
  it('treats lightning:lnbc… as lightning_invoice with normalized payload', () => {
    const bolt11 = 'lnbc1u1psomethingvalidlength';
    const r = detectPaymentType(`lightning:${bolt11}`);
    expect(r.type).toBe('lightning_invoice');
    expect(r.normalizedValue).toBe(bolt11);
  });

  it('treats lightning:lnurl… as lnurl with normalized payload', () => {
    const lnurl = 'lnurl1dp68gurn8ghj7em9wdskkccnvaek2anf4arj9vdex2mn5vd598cq';
    const r = detectPaymentType(`lightning:${lnurl}`);
    expect(r.type).toBe('lnurl');
    expect(r.normalizedValue).toBe(lnurl);
  });

  it('treats lightning:user@domain as lightning_address', () => {
    const addr = 'user@example.com';
    const r = detectPaymentType(`lightning:${addr}`);
    expect(r.type).toBe('lightning_address');
    expect(r.normalizedValue).toBe(addr);
  });

  it('strips lightning:// before re-detecting', () => {
    const addr = 'user@example.com';
    const r = detectPaymentType(`lightning://${addr}`);
    expect(r.type).toBe('lightning_address');
    expect(r.normalizedValue).toBe(addr);
  });

  it('returns unknown for empty input', () => {
    expect(detectPaymentType('')).toEqual({
      type: 'unknown',
      normalizedValue: '',
    });
  });

  it('detects raw BOLT11 mainnet prefix', () => {
    const inv = 'lnbc1abc';
    expect(detectPaymentType(inv)).toEqual({
      type: 'lightning_invoice',
      normalizedValue: inv,
    });
  });

  it('detects raw BOLT11 testnet prefix', () => {
    const inv = 'lntb1abc';
    expect(detectPaymentType(inv)).toEqual({
      type: 'lightning_invoice',
      normalizedValue: inv,
    });
  });

  it('detects raw LNURL', () => {
    const u = 'lnurl1dp68gurn8ghj7em9wdskkccnvaek2anf4arj9vdex2mn5vd598cq';
    expect(detectPaymentType(u)).toEqual({
      type: 'lnurl',
      normalizedValue: u,
    });
  });

  it('detects bech32 mainnet address', () => {
    const a = 'bc1qxyz';
    expect(detectPaymentType(a)).toEqual({
      type: 'bitcoin_address',
      normalizedValue: a,
    });
  });

  it('detects bech32 testnet address', () => {
    const a = 'tb1qxyz';
    expect(detectPaymentType(a)).toEqual({
      type: 'bitcoin_address',
      normalizedValue: a,
    });
  });

  it('detects legacy P2PKH', () => {
    const a = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    expect(detectPaymentType(a)).toEqual({
      type: 'bitcoin_address',
      normalizedValue: a,
    });
  });

  it('detects P2SH', () => {
    const a = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
    expect(detectPaymentType(a)).toEqual({
      type: 'bitcoin_address',
      normalizedValue: a,
    });
  });

  it('detects BIP21 bitcoin URI as bitcoin_address', () => {
    const uri = 'bitcoin:bc1qxyz';
    expect(detectPaymentType(uri)).toEqual({
      type: 'bitcoin_address',
      normalizedValue: 'bc1qxyz',
    });
  });

  it('returns unknown for random garbage', () => {
    const s = 'randomgarbage';
    expect(detectPaymentType(s)).toEqual({
      type: 'unknown',
      normalizedValue: s,
    });
  });
});

describe('parseBitcoinDestination', () => {
  it('returns null for empty string', () => {
    expect(parseBitcoinDestination('')).toBeNull();
  });

  it('parses plain address', () => {
    const parsed = parseBitcoinDestination('bc1qxyz');
    expect(parsed).toMatchObject({
      normalizedAddress: 'bc1qxyz',
    });
    expect(parsed).not.toHaveProperty('amountSats');
  });

  it('parses BIP21 with amount in BTC to sats', () => {
    expect(
      parseBitcoinDestination('bitcoin:bc1qxyz?amount=0.001'),
    ).toMatchObject({
      normalizedAddress: 'bc1qxyz',
      amountSats: 100_000,
    });
  });

  it('parses BIP21 with label and message', () => {
    expect(
      parseBitcoinDestination(
        'bitcoin:bc1qxyz?amount=1&label=Test&message=Hello',
      ),
    ).toMatchObject({
      normalizedAddress: 'bc1qxyz',
      amountSats: 100_000_000,
      label: 'Test',
      message: 'Hello',
    });
  });

  it('strips bitcoin:// scheme slashes', () => {
    expect(parseBitcoinDestination('bitcoin://bc1qxyz')).toMatchObject({
      normalizedAddress: 'bc1qxyz',
    });
  });

  it('returns null when URI has amount but no address', () => {
    expect(parseBitcoinDestination('bitcoin:?amount=1')).toBeNull();
  });
});
