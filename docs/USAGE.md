# How to Use Private Revenue Split

Welcome to **Private Revenue Split** — the zero-knowledge dApp that lets you split incoming payments confidentially on the Midnight Network without exposing individual cuts to anyone.

---

## What You Need

Before getting started, make sure you have:
1. **1AM Wallet (Midnight Preprod Network)** installed in your browser.
2. **Preprod Test Tokens (tDUST)** funded via the [Midnight Preprod Faucet](https://midnight-tmnight-preprod.nethermind.dev/).
3. Your private deal credentials (secret passphrase and salt) provided by your project manager or generated off-chain.

---

## Step-by-Step Guide

### Scenario 1: How to Set Up a Revenue Split (Deal Creator / Organizer)

1. **Connect Your Wallet**:
   - Click **Connect 1AM Wallet** at the top right of the dApp header.
   - Approve the connection request in the 1AM extension popup.
   - Confirm the network badge displays **preprod**.

2. **Navigate to "Register Split"**:
   - Click the **Register Split** tab on the dashboard.

3. **Generate Off-Chain Recipient Commitments**:
   - For each recipient (e.g. Alice & Bob), enter their private secret string (e.g. `alice_secret_123`), salt (`salt_alice_999`), and their private share amount (e.g. `700 tDUST`).
   - The commitment is computed as `persistent_hash([secret, salt, amount])` — this hash is what gets registered on-chain.

4. **Submit Commitment On-Chain**:
   - Click **Commit Recipient Cut On-Chain**.
   - The 1AM wallet extension will:
     - Generate a zero-knowledge proof internally (using the wallet's own proof server)
     - Balance the transaction with your available DUST
     - Submit the transaction to Midnight Preprod
   - **Result**: The ledger registers the commitment and updates the total pool balance without storing Alice or Bob's individual cuts!

5. **Monitor Transaction Progress**:
   - Watch the **Proof Logs** tab to see real-time status messages
   - When the transaction confirms, you'll see a success message with the transaction ID
   - The live stats cards will update automatically within 15 seconds (or click "Sync State")

---

### Scenario 2: How to Claim Your Payout (Recipient)

1. **Open "Claim Private Cut"**:
   - Click the **Claim Private Cut** tab.

2. **Enter Your Private Witness Credentials**:
   - **Recipient Private Secret Key**: Enter your private passphrase (e.g. `alice_secret_123`).
   - **Recipient Salt**: Enter your blinding salt (e.g. `salt_alice_999`).
   - **Claim Payout Amount**: Enter your exact cut (e.g. `700`).

3. **Generate & Submit Zero-Knowledge Proof**:
   - Click **Prove & Claim Payout Confidentiality**.
   - The 1AM wallet extension handles the entire ZK proof generation pipeline internally:
     - Loads the contract's proving key
     - Generates the proof using your private witness inputs
     - Balances the transaction
     - Submits to Midnight Preprod
   - The UI will display "Generating Zero-Knowledge Proof…" while the wallet processes your request.

4. **Approve Transaction in 1AM Wallet**:
   - A popup will appear asking you to approve the contract call transaction
   - Review the transaction details and click "Approve"

5. **Receive Confirmation & Nullifier**:
   - Once verified, the contract emits a unique nullifier on-chain to mark your payout as spent.
   - Your payout is collected while keeping your cut hidden from co-recipients!
   - The success panel will display:
     - **Transaction ID** — the on-chain TX hash (click to copy)
     - **Nullifier** — the spent marker (prevents double claims)
     - **Amount** — your confirmed payout

6. **Verify Live On-Chain State**:
   - The stats cards on the dashboard update automatically
   - **Total Split Out** should increase by your claim amount
   - **Claims Executed** should increment by 1
   - All data reflects confirmed on-chain state from the Midnight Preprod indexer

---

## Real Wallet Interaction Flow

```text
User clicks "Prove & Claim"
       ↓
React component calls connectedApi.buildAndSubmitContractCall()
       ↓
1AM Wallet extension receives contract call request
       ↓
Wallet loads proving key from its own proof server
       ↓
Wallet generates ZK proof with private witness inputs
       ↓
Wallet balances transaction with user's DUST
       ↓
Wallet submits to Midnight Preprod RPC
       ↓
Transaction confirmed on-chain
       ↓
React app receives transaction ID
       ↓
UI displays success panel with TX ID and nullifier
       ↓
Live stats refresh from indexer within 15 seconds
```

All ZK proof generation happens inside the 1AM wallet extension — the browser never loads proving keys, WASM circuits, or any Node-only SDK packages.

---

## What Gets Proved (and What Stays Private)

| Data Field | Visibility | Description |
|---|---|---|
| **Total Paid In** | `PUBLIC` (On-Chain) | Total revenue deposited into the pool, auditable by anyone via the Midnight indexer. |
| **Total Split Out** | `PUBLIC` (On-Chain) | Cumulative payouts claimed across all parties. Verified via ZK sum constraint. |
| **Split Commitment** | `PUBLIC` (On-Chain) | Cryptographic anchor proving split structure validity. |
| **Nullifiers** | `PUBLIC` (On-Chain) | One-time spent markers preventing double claims. Each nullifier is `persistent_hash([secret, poolId])`. |
| **Recipient Secret Key** | `PRIVATE` (Witness) | Stays on recipient's local machine; never leaves device, never sent on-chain. |
| **Recipient Salt** | `PRIVATE` (Witness) | Blinds off-chain commitment. Never exposed publicly. |
| **Individual Cut Amount** | `PRIVATE` (Witness) | Hidden from co-recipients, clients, and block explorers. Verified via ZK proof. |
| **ZK Sum Proof** | `PROVED` | Proves `sum(cuts) <= totalPaidIn` without exposing individual numbers. |

---

## Troubleshooting

### Issue 1: "Claim failed: Commitment not found in split registry"
- **Cause**: The secret key, salt, or claim amount does not match the exact values used when the commitment was registered.
- **Solution**: Double-check typos or capitalization in your secret string and salt. The commitment hash is computed from all three values — even one character difference will produce a different hash.

### Issue 2: "Double claim rejected: Payout already claimed for this pool"
- **Cause**: A payout nullifier has already been recorded on the Midnight ledger for this secret and pool ID.
- **Solution**: Payouts can only be claimed once per pool. Verify whether you already executed the claim by checking the on-chain nullifier list.

### Issue 3: "Claim rejected: Cumulative payouts exceed total pool revenue"
- **Cause**: The total claimed amount across all recipients would exceed `totalPaidIn`.
- **Solution**: Ensure the organizer has funded the pool with adequate `totalPaidIn` balance before registering commitments.

### Issue 4: "Wallet not connected"
- **Cause**: The 1AM wallet extension is not installed or not connected to Midnight Preprod.
- **Solution**: Install the [1AM Wallet extension](https://1am.xyz) and configure it for the Midnight Preprod network.

### Issue 5: "Insufficient DUST balance"
- **Cause**: Your wallet does not have enough DUST to cover transaction fees.
- **Solution**: Fund your wallet from the [Midnight Preprod Faucet](https://midnight-tmnight-preprod.nethermind.dev/).

### Issue 6: Stats cards show "…" or zeros
- **Cause**: The UI is loading live state from the Midnight Preprod indexer, or the contract has not been deployed yet.
- **Solution**: Wait up to 15 seconds for the initial fetch, or click "Sync State" to trigger an immediate refresh.

---

## Live On-Chain State

The dashboard displays **live confirmed on-chain values** fetched directly from the Midnight Preprod indexer every 15 seconds:

- **Total Paid In** — sum of all revenue deposits
- **Total Split Out** — sum of all ZK-verified claims
- **Commitments** — number of registered recipient commitments
- **Claims Executed** — number of spent nullifiers

All values reflect the current ledger state on Midnight Preprod. There is no in-memory simulation — every number comes from the real blockchain indexer.

---

## Smart Contract Function Execution

The dApp interacts with three Compact circuits deployed on Midnight Preprod:

### 1. `initialize(organizerKey, initialTotal, ruleCommitment)`
- Sets up the contract with the organizer's public key and initial revenue pool balance
- Called once during deployment
- Not exposed in the UI (handled by deployment script)

### 2. `registerRecipient(organizerSecret, commitment, addedRevenue)`
- Registers a new recipient commitment on-chain
- Updates the total pool balance if additional revenue is deposited
- Requires organizer authorization (proves `persistent_hash(organizerSecret) == organizerPublicKey`)
- Exposed in the UI via the "Register Split" tab

### 3. `claimPayout(witness, claimAmount, poolId)`
- Verifies a recipient's private witness and allows them to claim their payout
- Enforces ZK constraints: commitment exists, nullifier is unique, sum ≤ totalPaidIn
- Returns a nullifier that prevents double claims
- Exposed in the UI via the "Claim Private Cut" tab

All three circuits are implemented in `contracts/revenue-split.compact` and compiled to WASM/proving keys in `contracts/managed/RevenueSplit/`.
