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
