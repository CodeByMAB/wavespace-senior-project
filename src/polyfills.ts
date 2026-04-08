// This file must be imported before any crypto-using module (see index.ts).

// 1. Buffer — needed by bip39
const { Buffer } = require('buffer');
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// 2. crypto.getRandomValues — bip39, bcryptjs, @noble/ciphers (via globalThis.crypto).
const ExpoCrypto = require('expo-crypto');
const g = globalThis as typeof globalThis & {
  crypto?: Crypto & { getRandomValues?: typeof ExpoCrypto.getRandomValues };
};
if (typeof g.crypto === 'undefined') {
  g.crypto = {} as typeof g.crypto;
}
if (typeof g.crypto.getRandomValues !== 'function') {
  g.crypto.getRandomValues = ExpoCrypto.getRandomValues;
}
