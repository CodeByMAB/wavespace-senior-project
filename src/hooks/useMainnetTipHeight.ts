import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMainnetTipHeight } from '@services/chainTipService';

/**
 * Refreshes Bitcoin mainnet tip height when the screen is focused (public indexer, not Breez SDK).
 */
export function useMainnetTipHeight() {
  const [height, setHeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void (async () => {
        const h = await fetchMainnetTipHeight();
        if (!cancelled) {
          setHeight(h);
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { height, loading };
}
