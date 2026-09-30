/**
 * indexer.ts — Live on-chain ledger state reader via the Midnight Preprod GraphQL indexer
 *
 * Fetches the current public ledger state for the deployed RevenueSplit contract
 * directly from the Midnight Preprod indexer, so the UI always reflects confirmed
 * on-chain values rather than local in-memory simulation.
 *
 * The indexer exposes contract state at:
 *   POST https://indexer.preprod.midnight.network/api/v4/graphql
 *
 * All ledger fields (totalPaidIn, totalSplitOut, claimCount, recipientCommitments,
 * claimedNullifiers) are public on-chain state and can be read without a wallet.
 */

import { CONTRACT_ADDRESS, INDEXER_URI } from '../config/network.js';

// ── Public ledger shape (mirrors the Compact contract's export ledger fields) ─

export interface OnChainLedgerState {
  /** Total revenue deposited into the pool (Uint<32> on-chain → bigint here). */
  totalPaidIn: bigint;
  /** Cumulative sum of all claimed payouts verified by ZK proof. */
  totalSplitOut: bigint;
  /** Number of successful private claims executed. */
  claimCount: bigint;
  /** Number of registered recipient commitment entries in the on-chain map. */
  recipientCommitmentCount: number;
  /** Number of spent nullifiers — equals number of completed claims. */
  claimedNullifierCount: number;
  /** Raw organizer public key hex (for display / verification). */
  organizerPublicKey: string;
  /** Split commitment hex registered by the organizer. */
  splitCommitment: string;
  /** ISO timestamp of the last successful indexer fetch. */
  lastSyncedAt: string;
  /** Whether this data came from the live indexer (true) or fallback defaults (false). */
  isLive: boolean;
}

/** Fallback / loading state returned before the first successful fetch. */
export const LOADING_STATE: OnChainLedgerState = {
  totalPaidIn: 0n,
  totalSplitOut: 0n,
  claimCount: 0n,
  recipientCommitmentCount: 0,
  claimedNullifierCount: 0,
  organizerPublicKey: '',
  splitCommitment: '',
  lastSyncedAt: new Date().toISOString(),
  isLive: false,
};

// ── GraphQL query ─────────────────────────────────────────────────────────────

/**
 * Queries the Midnight Preprod indexer for the deployed contract's current
 * public ledger state.
 *
 * The Midnight indexer v4 GraphQL schema exposes contract state under
 * `contract(address: String!)` with a `state` field that returns the
 * serialised ledger as a JSON map keyed by circuit/ledger variable names.
 *
 * We request every exported ledger field declared in revenue-split.compact:
 *   organizerPublicKey, splitCommitment, totalPaidIn, totalSplitOut,
 *   claimCount, recipientCommitments, claimedNullifiers
 */
const LEDGER_QUERY = `
  query ContractLedgerState($address: String!) {
    contract(address: $address) {
      address
      state {
        organizerPublicKey
        splitCommitment
        totalPaidIn
        totalSplitOut
        claimCount
        recipientCommitments {
          edges {
            node {
              key
              value
            }
          }
          totalCount
        }
        claimedNullifiers {
          edges {
            node {
              key
              value
            }
          }
          totalCount
        }
      }
    }
  }
`;

// ── Response types ────────────────────────────────────────────────────────────

interface MapEdge {
  node: { key: string; value: boolean };
}

interface IndexerContractState {
  organizerPublicKey?: string;
  splitCommitment?: string;
  totalPaidIn?: string | number;
  totalSplitOut?: string | number;
  claimCount?: string | number;
  recipientCommitments?: { edges: MapEdge[]; totalCount?: number };
  claimedNullifiers?: { edges: MapEdge[]; totalCount?: number };
}

interface IndexerResponse {
  data?: {
    contract?: {
      address: string;
      state?: IndexerContractState;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

// ── Core fetch function ───────────────────────────────────────────────────────

/**
 * Fetches the live on-chain ledger state from the Midnight Preprod indexer.
 *
 * @param contractAddress - Hex contract address (defaults to deployed address from config).
 * @param indexerUri      - GraphQL endpoint (defaults to Preprod public indexer).
 * @returns Parsed on-chain ledger state, or LOADING_STATE on any error.
 */
export async function fetchLedgerState(
  contractAddress: string = CONTRACT_ADDRESS,
  indexerUri: string = INDEXER_URI
): Promise<OnChainLedgerState> {
  try {
    const response = await fetch(indexerUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: LEDGER_QUERY,
        variables: { address: contractAddress },
      }),
      // 10-second timeout — enough for the public indexer to respond
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[indexer] HTTP ${response.status} from indexer — falling back to defaults`);
      return { ...LOADING_STATE, lastSyncedAt: new Date().toISOString() };
    }

    const json: IndexerResponse = await response.json();

    // Surface GraphQL-level errors (contract not found, schema mismatch, etc.)
    if (json.errors?.length) {
      console.warn('[indexer] GraphQL errors:', json.errors.map((e) => e.message).join('; '));
    }

    const contractData = json.data?.contract;
    if (!contractData || !contractData.state) {
      // Contract address not yet indexed — may happen during first deployment propagation
      console.warn('[indexer] Contract not found in indexer yet — address:', contractAddress);
      return { ...LOADING_STATE, lastSyncedAt: new Date().toISOString() };
    }

    const s = contractData.state;

    // Parse integer ledger fields — indexer returns them as decimal strings or numbers
    const totalPaidIn  = parseBigInt(s.totalPaidIn);
    const totalSplitOut = parseBigInt(s.totalSplitOut);
    const claimCount   = parseBigInt(s.claimCount);

    // Map sizes: prefer totalCount if available, fall back to edges array length
    const recipientCommitmentCount =
      s.recipientCommitments?.totalCount ?? s.recipientCommitments?.edges?.length ?? 0;
    const claimedNullifierCount =
      s.claimedNullifiers?.totalCount ?? s.claimedNullifiers?.edges?.length ?? 0;

    return {
      totalPaidIn,
      totalSplitOut,
      claimCount,
      recipientCommitmentCount,
      claimedNullifierCount,
      organizerPublicKey: s.organizerPublicKey ?? '',
      splitCommitment:    s.splitCommitment    ?? '',
      lastSyncedAt: new Date().toISOString(),
      isLive: true,
    };
  } catch (err: any) {
    // Network error, timeout, or JSON parse failure
    if (err?.name === 'TimeoutError') {
      console.warn('[indexer] Request timed out — indexer may be temporarily unavailable');
    } else {
      console.error('[indexer] Unexpected fetch error:', err?.message ?? err);
    }
    return { ...LOADING_STATE, lastSyncedAt: new Date().toISOString() };
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function parseBigInt(value: string | number | undefined): bigint {
  if (value === undefined || value === null) return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}
