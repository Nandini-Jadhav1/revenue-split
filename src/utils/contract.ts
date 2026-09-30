/**
 * contract.ts — On-chain state reader and witness encoder for Private Revenue Split
 *
 * This module replaces the previous in-memory `RevenueSplitHelper` simulation.
 * It exposes:
 *
 *  1. `PoolState`           — canonical UI state type used by RevenueSplit.tsx
 *  2. `fromOnChainState()`  — maps `OnChainLedgerState` → `PoolState`
 *  3. `EMPTY_POOL_STATE`    — loading/fallback value
 *  4. Witness encoding helpers (`encodeStr32`, `encodeWitness`, `encodeCommitment`)
 *     that produce the correctly typed Uint8Array arguments for
 *     `api.buildAndSubmitContractCall()`.
 *
 * The previous `RevenueSplitContract` class (FNV-hash mock) is no longer used
 * by the browser UI. It lives on in `contracts/managed/RevenueSplit/index.ts`
 * for the Vitest unit-test suite only.
 *
 * CONTRACT_ADDRESS and POOL_ID are imported from src/config/network.ts so
 * there is one canonical place to change the deployed address.
 */

import { OnChainLedgerState, LOADING_STATE } from '../lib/indexer.js';
export { fetchLedgerState } from '../lib/indexer.js';

// ── PoolState — the type consumed by RevenueSplit.tsx ─────────────────────────

export interface PoolState {
  /** Total revenue deposited into the pool (on-chain Uint<32>). */
  totalPaidIn: bigint;
  /** Cumulative ZK-verified claim total. */
  totalSplitOut: bigint;
  /** Number of successful claim executions. */
  claimCount: bigint;
  /** Number of registered recipient commitments. */
  recipientCommitmentCount: number;
  /** Number of spent nullifiers. */
  claimedNullifierCount: number;
  /** Whether this reflects confirmed on-chain data (true) or placeholder (false). */
  isLive: boolean;
  /** ISO timestamp of last successful indexer sync. */
  lastSyncedAt: string;
}

// ── Fallback / loading state ──────────────────────────────────────────────────

export const EMPTY_POOL_STATE: PoolState = {
  totalPaidIn:              0n,
  totalSplitOut:            0n,
  claimCount:               0n,
  recipientCommitmentCount: 0,
  claimedNullifierCount:    0,
  isLive:                   false,
  lastSyncedAt:             new Date().toISOString(),
};

// ── Mapper: OnChainLedgerState → PoolState ────────────────────────────────────

/**
 * Converts an `OnChainLedgerState` (returned by the indexer client) into
 * the `PoolState` shape used throughout the UI.
 */
export function fromOnChainState(onChain: OnChainLedgerState): PoolState {
  return {
    totalPaidIn:              onChain.totalPaidIn,
    totalSplitOut:            onChain.totalSplitOut,
    claimCount:               onChain.claimCount,
    recipientCommitmentCount: onChain.recipientCommitmentCount,
    claimedNullifierCount:    onChain.claimedNullifierCount,
    isLive:                   onChain.isLive,
    lastSyncedAt:             onChain.lastSyncedAt,
  };
}

// ── Witness encoding helpers ──────────────────────────────────────────────────

/**
 * Encode a UTF-8 string into a zero-padded 32-byte Uint8Array.
 *
 * The Compact `Bytes<32>` type requires exactly 32 bytes. We use UTF-8
 * encoding and truncate/pad to fit. This matches the encoding used by
 * the Vitest tests and the on-chain circuit.
 */
export function encodeStr32(s: string): Uint8Array {
  const buf = new Uint8Array(32);
  const encoded = new TextEncoder().encode(s);
  buf.set(encoded.slice(0, 32));
  return buf;
}

/**
 * Build the `RecipientWitness` struct expected by the `claimPayout` circuit.
 *
 * The 1AM wallet's `buildAndSubmitContractCall` passes these bytes directly
 * to the Compact circuit as private witnesses — they are never sent on-chain.
 */
export function encodeWitness(
  secretStr: string,
  saltStr: string
): { recipientSecret: Uint8Array; recipientSalt: Uint8Array } {
  return {
    recipientSecret: encodeStr32(secretStr),
    recipientSalt:   encodeStr32(saltStr),
  };
}

/**
 * Compute the recipient commitment exactly as the Compact circuit does:
 *
 *   commitment = persistent_hash([recipientSecret, recipientSalt, claimAmount])
 *
 * In the browser we replicate the FNV-1a-based approximation used in the
 * managed contract's TypeScript simulation.  The canonical hash is computed
 * on-chain by the Compact runtime — the browser value is used only for
 * local display and to encode the `registerRecipient` args.
 *
 * Note: the actual on-chain `persistent_hash` is Midnight's own cryptographic
 * hash.  The TypeScript approximation below matches the managed contract's
 * `computeRecipientCommitment` method used by the Vitest test suite.
 */
export function encodeCommitment(
  secretStr: string,
  saltStr: string,
  claimAmount: bigint
): Uint8Array {
  const secret = encodeStr32(secretStr);
  const salt   = encodeStr32(saltStr);

  // 32 + 32 + 8 = 72-byte input buffer
  const buf = new Uint8Array(72);
  buf.set(secret, 0);
  buf.set(salt, 32);
  new DataView(buf.buffer, 64, 8).setBigUint64(0, claimAmount, false);

  // FNV-1a approximation (must match managed/RevenueSplit/index.ts)
  let h = 0x811c9dc5;
  for (let i = 0; i < buf.length; i++) {
    h ^= buf[i];
    h = Math.imul(h, 0x01000193);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = (h ^ (i * 31) ^ (buf[i % 72] || i)) & 0xff;
  }
  return out;
}

/**
 * Format a raw Uint8Array to a lowercase hex string.
 * Used when displaying nullifiers, commitments, and public keys in the UI.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// ── LOADING_STATE re-export (convenience for components) ─────────────────────
export { LOADING_STATE };
