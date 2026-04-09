const COINBASE_SPOT_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
const PRICE_TTL_MS = 60_000;

let cachedPriceUsd = 0;
let lastUpdatedAt = 0;

export function getCachedBtcPriceUsd(): number {
  return cachedPriceUsd;
}

export async function getBtcPriceUsd(): Promise<number> {
  const now = Date.now();
  if (cachedPriceUsd > 0 && now - lastUpdatedAt < PRICE_TTL_MS) {
    return cachedPriceUsd;
  }

  try {
    const response = await fetch(COINBASE_SPOT_URL);
    if (!response.ok) {
      throw new Error(`Price fetch failed with status ${response.status}`);
    }

    const body = (await response.json()) as {
      data?: { amount?: string };
    };

    const amount = Number(body?.data?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid BTC/USD spot response');
    }

    cachedPriceUsd = amount;
    lastUpdatedAt = now;
    return cachedPriceUsd;
  } catch {
    return cachedPriceUsd;
  }
}
