/**
 * network.ts — Canonical network configuration for Private Revenue Split
 *
 * Single source of truth for every URL, address, and network identifier
 * used by the browser frontend. Override any value at build time via
 * Vite's VITE_* environment variables (see .env.example).
 *
 * Midnight Preprod endpoints are the official public endpoints published
 * by Midnight Network for pre-production testing.
 */

// ── Network identity ──────────────────────────────────────────────────────────

/** Midnight network identifier string required by the 1AM DApp Connector. */
export const NETWORK_ID = 'preprod' as const;

// ── Deployed contract ─────────────────────────────────────────────────────────

/**
 * On-chain address of the deployed RevenueSplit Compact contract.
 * Deployed to Midnight Preprod — recoverable from .contract-address.
 *
 * Override at build time:
 *   VITE_CONTRACT_ADDRESS=<hex> npm run build
 */
export const CONTRACT_ADDRESS: string =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS ??
  '02005a9c0897f1da76135dd6977be415f3cf374466986b24d77eb60cbe4eeef45a8e';

// ── Midnight Preprod public endpoints ────────────────────────────────────────

/**
 * GraphQL HTTP endpoint for the Midnight Preprod indexer.
 * Used by src/lib/indexer.ts to query live on-chain ledger state.
 */
export const INDEXER_URI: string =
  (import.meta as any).env?.VITE_INDEXER_URI ??
  'https://indexer.preprod.midnight.network/api/v4/graphql';

/**
 * GraphQL WebSocket endpoint — used for future subscription support.
 */
export const INDEXER_WS_URI: string =
  (import.meta as any).env?.VITE_INDEXER_WS_URI ??
  'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';

/**
 * Midnight Preprod RPC node endpoint.
 */
export const NODE_URI: string =
  (import.meta as any).env?.VITE_NODE_URI ??
  'https://rpc.preprod.midnight.network';

/**
 * Local proof server endpoint.
 * Only relevant for server-side deployment scripts — not used in the browser bundle.
 * The 1AM wallet extension manages proof generation internally via its own backend.
 */
export const PROOF_SERVER_URI: string =
  (import.meta as any).env?.VITE_PROOF_SERVER_URI ??
  'http://localhost:6300';

// ── Pool configuration ────────────────────────────────────────────────────────

/**
 * Fixed 32-byte pool identifier (0x99 × 32).
 * All circuits and state reads use this same poolId.
 * Must match the poolId used in contract deployment and test suite.
 */
export const POOL_ID: Uint8Array = new Uint8Array(32).fill(0x99);

// ── Explorer / faucet helpers ─────────────────────────────────────────────────

/** Midnight Preprod faucet for obtaining test DUST. */
export const FAUCET_URI = 'https://midnight-tmnight-preprod.nethermind.dev/';

/** Human-readable contract explorer URL (when available on Preprod). */
export const contractExplorerUrl = (address: string): string =>
  `https://midnight.network/preprod/contract/${address}`;

/** Human-readable transaction explorer URL. */
export const transactionExplorerUrl = (txId: string): string =>
  `https://midnight.network/preprod/tx/${txId}`;

// ── Re-export as a config object (convenience) ───────────────────────────────

export const NETWORK_CONFIG = {
  networkId:    NETWORK_ID,
  contractAddress: CONTRACT_ADDRESS,
  indexerUri:   INDEXER_URI,
  indexerWsUri: INDEXER_WS_URI,
  nodeUri:      NODE_URI,
  proofServer:  PROOF_SERVER_URI,
  poolId:       POOL_ID,
  faucetUri:    FAUCET_URI,
} as const;
