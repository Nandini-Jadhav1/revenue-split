/**
 * useLedgerState.ts — React hook for live on-chain ledger state
 *
 * Polls the Midnight Preprod indexer on mount and every POLL_INTERVAL ms,
 * returning the latest confirmed public ledger values.  Callers can also
 * trigger an immediate refresh via the returned `refresh()` function — used
 * after a successful claim or register transaction so the stats cards update
 * without waiting for the next poll cycle.
 *
 * This hook replaces the previous pattern of reading from the in-memory
 * `contractHelper.getLedgerState()` mock, which never reflected real on-chain
 * state and reset to defaults on every page load.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLedgerState, OnChainLedgerState, LOADING_STATE } from '../lib/indexer.js';
import { CONTRACT_ADDRESS, INDEXER_URI } from '../config/network.js';

/** Poll the indexer every 15 seconds while the tab is visible. */
const POLL_INTERVAL_MS = 15_000;

export interface UseLedgerStateResult {
  /** Current on-chain ledger values. Starts as LOADING_STATE until first fetch. */
  ledger: OnChainLedgerState;
  /** True while the very first fetch is in-flight (before any data is available). */
  isLoading: boolean;
  /** True while any fetch (including background polls) is in-flight. */
  isFetching: boolean;
  /** Error message from the last failed fetch, or null if last fetch succeeded. */
  fetchError: string | null;
  /** Manually trigger an immediate re-fetch. Returns the new state when resolved. */
  refresh: () => Promise<OnChainLedgerState>;
}

export function useLedgerState(
  contractAddress: string = CONTRACT_ADDRESS,
  indexerUri: string = INDEXER_URI
): UseLedgerStateResult {
  const [ledger, setLedger] = useState<OnChainLedgerState>(LOADING_STATE);
  const [isLoading, setIsLoading] = useState(true);   // true until first successful fetch
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Use a ref so the interval callback always has the latest contract address
  // without needing to re-register the interval on every prop change.
  const addressRef = useRef(contractAddress);
  const uriRef     = useRef(indexerUri);
  addressRef.current = contractAddress;
  uriRef.current     = indexerUri;

  const doFetch = useCallback(async (): Promise<OnChainLedgerState> => {
    setIsFetching(true);
    try {
      const state = await fetchLedgerState(addressRef.current, uriRef.current);
      setLedger(state);
      setFetchError(null);
      setIsLoading(false);
      return state;
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to fetch ledger state from indexer.';
      setFetchError(msg);
      setIsLoading(false);
      return ledger; // return previous state on error
    } finally {
      setIsFetching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initial fetch + polling ─────────────────────────────────────────────────

  useEffect(() => {
    // Fetch immediately on mount
    doFetch();

    // Set up background polling — pause when the tab is hidden
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        doFetch();
      }
    }, POLL_INTERVAL_MS);

    // Re-fetch immediately when the tab becomes visible again after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doFetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [doFetch]);

  return {
    ledger,
    isLoading,
    isFetching,
    fetchError,
    refresh: doFetch,
  };
}
