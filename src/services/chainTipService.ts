/**
 * Bitcoin mainnet chain tip — fetched from a public indexer (not the Breez SDK, which does not
 * expose block height on getInfo).
 */
const MEMPOOL_MAINNET_TIP_HEIGHT_URL = 'https://mempool.space/api/blocks/tip/height';

export async function fetchMainnetTipHeight(): Promise<number | null> {
  try {
    const response = await fetch(MEMPOOL_MAINNET_TIP_HEIGHT_URL);
    if (!response.ok) {
      return null;
    }
    const text = (await response.text()).trim();
    const height = parseInt(text, 10);
    if (!Number.isFinite(height) || height < 0) {
      return null;
    }
    return height;
  } catch {
    return null;
  }
}
