export function isBolt11(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('lnbc') || normalized.startsWith('lntb');
}

export function sanitizePaymentInput(value: string): string {
  return value.trim();
}

export function satsToMsat(sats?: number): number | undefined {
  if (sats === undefined) return undefined;
  return sats * 1000;
}

export function msatToSat(msat?: number): number | undefined {
  if (msat === undefined) return undefined;
  return Math.floor(msat / 1000);
}