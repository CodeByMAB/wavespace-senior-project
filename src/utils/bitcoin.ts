export interface ParsedBitcoinDestination {
  rawInput: string;
  normalizedAddress: string;
  amountSats?: number;
  label?: string;
  message?: string;
}

function btcToSats(amount: string): number | undefined {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,8})?$/.test(trimmed)) return undefined;
  const [whole, fraction = ''] = trimmed.split('.');
  const fractionPadded = `${fraction}00000000`.slice(0, 8);
  return Number.parseInt(whole, 10) * 100_000_000 + Number.parseInt(fractionPadded, 10);
}

export type PaymentType =
  | 'lightning_invoice'
  | 'bitcoin_address'
  | 'lnurl'
  | 'lightning_address'
  | 'unknown';

export interface DetectPaymentTypeResult {
  type: PaymentType;
  normalizedValue: string;
}

const BOLT11_PREFIXES = ['lnbc', 'lntb', 'lnbcrt'] as const;

const LIGHTNING_ADDRESS_RE =
  /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function detectPaymentType(raw: string): DetectPaymentTypeResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {type: 'unknown', normalizedValue: ''};
  }

  if (/^lightning:/i.test(trimmed)) {
    let rest = trimmed.replace(/^lightning:/i, '');
    if (rest.startsWith('//')) {
      rest = rest.slice(2);
    }
    const inner = rest.trim();
    if (!inner) {
      return {type: 'unknown', normalizedValue: ''};
    }
    return detectPaymentType(inner);
  }

  const lower = trimmed.toLowerCase();
  for (const p of BOLT11_PREFIXES) {
    if (lower.startsWith(p)) {
      return {type: 'lightning_invoice', normalizedValue: trimmed};
    }
  }

  if (/^bitcoin:/i.test(trimmed)) {
    const parsed = parseBitcoinDestination(trimmed);
    if (parsed?.normalizedAddress) {
      return {type: 'bitcoin_address', normalizedValue: parsed.normalizedAddress};
    }
    return {type: 'unknown', normalizedValue: trimmed};
  }

  if (lower.startsWith('lnurl')) {
    return {type: 'lnurl', normalizedValue: trimmed};
  }

  if (LIGHTNING_ADDRESS_RE.test(trimmed)) {
    return {type: 'lightning_address', normalizedValue: trimmed};
  }

  if (lower.startsWith('bc1') || lower.startsWith('tb1')) {
    return {type: 'bitcoin_address', normalizedValue: trimmed};
  }

  const first = trimmed[0];
  if (first === '1' || first === '3' || first === 'm' || first === 'n' || first === '2') {
    return {type: 'bitcoin_address', normalizedValue: trimmed};
  }

  return {type: 'unknown', normalizedValue: trimmed};
}

export function parseBitcoinDestination(input: string): ParsedBitcoinDestination | null {
  const rawInput = input.trim();
  if (!rawInput) return null;

  const isBitcoinUri = /^bitcoin:/i.test(rawInput);
  if (!isBitcoinUri) {
    return {
      rawInput,
      normalizedAddress: rawInput,
    };
  }

  let payload = rawInput.replace(/^bitcoin:/i, '');
  if (payload.startsWith('//')) {
    payload = payload.slice(2);
  }

  const [addressPart, query = ''] = payload.split('?');
  const normalizedAddress = decodeURIComponent(addressPart || '').trim();
  if (!normalizedAddress) return null;

  const params = new URLSearchParams(query);
  const amountRaw = params.get('amount');
  const amountSats = amountRaw ? btcToSats(amountRaw) : undefined;
  const label = params.get('label') ?? undefined;
  const message = params.get('message') ?? undefined;

  return {
    rawInput,
    normalizedAddress,
    amountSats,
    label,
    message,
  };
}
