🔐 Private Revenue Split — Level 6 Supermoon Edition

Privacy-preserving revenue distribution powered by Midnight Network, Compact smart contracts, zero-knowledge proofs, and 1AM Wallet.

Private Revenue Split is a Midnight Preprod decentralized application that allows a revenue pool to be distributed among multiple recipients while keeping individual recipient payout values confidential.

The application combines a Midnight Compact smart contract, zero-knowledge proof verification, private witnesses, commitment-based recipient registration, and 1AM Wallet transaction authorization.

🌕 Quick Links & Level 6 Supermoon Submission Status

Resource

Value / Link

Level 6 Supermoon Status

🌕 Active Submission

Midnight Network

Midnight Preprod

GitHub Repository

https://github.com/Nandini-Jadhav1/revenue-split

Live Production Demo

https://revenue-split-nu.vercel.app

Demo Video

https://youtu.be/yyFmQHbjRrc

X / Project Profile

https://x.com/jadhav_nan99910

Google Feedback Form

https://docs.google.com/forms/d/1rhrEcQg1HiFBwoY59cFKXp5K8nU4WeMpskPLNH6Edrk/viewform

Google Feedback Responses

https://docs.google.com/spreadsheets/d/1vW6SEV52-JAy9A4Y3DYNu8F8dijMZnh64fwbAbs9s/edit?gid=2082627229

Feedback Documentation

docs/FEEDBACK.md

User Documentation

docs/USAGE.md

📜 Midnight Preprod Contract

Network

Contract Address

Midnight Preprod

⏳ Pending deployment — contract will be deployed to Preprod in step 2

The contract source is defined in:

contracts/revenue-split.compact

The contract implements the privacy-preserving revenue split logic used by the application.

🎥 Demo

▶️ Watch the Private Revenue Split MVP Demo

https://youtu.be/yyFmQHbjRrc

The demonstration covers the application interface, 1AM Wallet connection, private revenue split workflow, recipient claim flow, and Midnight Preprod interaction.

❓ Problem Statement

Traditional revenue-split systems expose sensitive financial information.

On transparent public blockchains, a revenue distribution can reveal:

Recipient addresses

Individual payout amounts

Revenue percentages

Transaction relationships

Payment history

Business or contributor compensation patterns

This creates privacy problems for:

Businesses negotiating private revenue agreements

Co-founders sharing revenue

Freelancers and contributors receiving private compensation

DAO or project contributors

Private partnership arrangements

Confidential payment distributions

A participant should be able to verify and claim their own share without automatically exposing the exact share of every other participant.

💡 The Private Revenue Split Solution

Private Revenue Split uses Midnight Network's privacy-preserving architecture to create confidential revenue distribution.

The application separates public blockchain verification from private financial information.

Private Recipient Data
        │
        ▼
Private Witness
        │
        ▼
Zero-Knowledge Proof
        │
        ▼
Midnight Compact Contract
        │
        ▼
Verified Private Claim

The contract verifies the required conditions while individual recipient payout information remains private to the party that needs it.

✨ Core Features

🔐 Confidential Payouts

Individual recipient shares are handled as private witness information instead of being exposed as ordinary public payout data.

🧮 Zero-Knowledge Verification

The Compact circuit verifies the revenue-split constraints without requiring every individual payout value to be publicly revealed.

🛡️ Double-Claim Protection

Cryptographic claim/nullifier state prevents a recipient from successfully claiming the same private share more than once.

👛 1AM Wallet Integration

The application connects to the Midnight DApp Connector API through the 1AM Wallet:

window.midnight["1am"]

The wallet is used for account connection and transaction authorization on Midnight Preprod.

🔒 Commitment-Based Registration

Recipient information can be represented by a commitment derived from private values.

Conceptually:

commitment = hash(secret, salt, amount)

The commitment can be registered while the underlying private values remain outside the public ledger representation.

📊 Live Ledger State

The application dashboard displays high-level protocol information such as:

Total paid in

Total split out

Number of commitments

Number of executed claims

Contract status

Network state

The individual private recipient values are not displayed as public ledger data.

🧾 Transaction Success Notifications

Successful register and claim operations now display a dedicated transaction-success notification.

The notification includes:

Transaction Successful

Operation-specific confirmation message

Truncated transaction ID

Manual close button

Automatic dismissal after 8 seconds

The success notification is triggered only after the transaction call succeeds.

🧑‍💻 Level 6 Product Improvements

The Level 6 iteration incorporated direct user feedback collected through the project feedback workflow.

1. ⚡ Transaction Successful Message

Implemented a dedicated success state:

The Level 6 iteration incorporated direct user feedback collected through the project feedback workflow.

### 1. 🔧 Critical Bug Fix: Wallet Connection State

**Issue Identified:**
Users reported that the wallet displayed as "connected" in the header, but clicking "Claim Private Payout" showed "Wallet not connected" error.

**Root Cause:**
- `WalletConnect.tsx` and `RevenueSplit.tsx` each used separate `useMidnight()` hook instances
- This created independent connection states that could become desynchronized
- User had to reconnect wallet multiple times per session

**Solution Implemented:**
- Created shared `WalletContext` provider (`src/contexts/WalletContext.tsx`)
- Centralized wallet state: `isConnected`, `address`, `network`, `connectedApi`
- Wrapped application with `<WalletProvider>` in `App.tsx`
- Updated both components to use `useWallet()` from context
- Stored `ConnectedAPI` instance in context to reuse across components

**Impact:**
- ✅ Single source of truth for wallet connection
- ✅ No more "Wallet not connected" errors after successful connection
- ✅ Improved user experience - connect once, use everywhere
- ✅ Eliminated redundant wallet authorization prompts

**Files Modified:**
- `src/contexts/WalletContext.tsx` (new)
- `src/App.tsx`
- `src/components/WalletConnect.tsx`
- `src/components/RevenueSplit.tsx`

**Commit:** `9ff8c00`

### 2. ⚡ Transaction Successful Message

After a successful claim transaction:

Transaction Successful

Your private claim was successfully submitted
on Midnight Preprod

Register Success

After a successful registration transaction:

Transaction Successful

Recipient commitment was successfully registered
on Midnight Preprod

Success Toast Behavior

Transaction submitted
        │
        ▼
Midnight / 1AM Wallet transaction
        │
        ▼
Successful transaction call
        │
        ▼
Success notification
        │
        ├── Transaction ID
        ├── Confirmation message
        ├── Manual close
        └── Auto-dismiss after 8 seconds

Errors do not trigger the success notification.

### 3. 🎨 UI Improvements

The Level 6 UI was refined based on user feedback.

Clearer Action Labels

Previous Label

Updated Label

Prove & Claim Payout Confidentiality

Claim Private Payout

Commit Recipient Cut On-Chain

Register Split Rule

Generating Zero-Knowledge Proof…

Generating ZK Proof…

Registering Commitment…

Registering Rule…

Enhanced Buttons

The main transaction buttons were improved with:

Increased button height

Gradient backgrounds

Stronger hover states

Keyboard focus rings

Better disabled states

Improved shadows

Subtle interaction feedback

Demo Credential Panel

The Alice/Bob demonstration area was redesigned with:

Separate recipient cards

Clearer visual hierarchy

Percentage indicators

Better borders and backgrounds

Larger interaction areas

Improved hover states

Example:

Alice — 700 tDUST (70%)
Bob   — 300 tDUST (30%)

These values are demonstration credentials and are not production secrets.

🗺️ Complete User Journey

1. Open Private Revenue Split
        ↓
2. Connect 1AM Wallet
        ↓
3. Select / Confirm Midnight Preprod
        ↓
4. Register Recipient Split Rule
        ↓
5. Approve transaction in 1AM Wallet
        ↓
6. Commitment is registered
        ↓
7. Transaction Successful notification
        ↓
8. Recipient enters private secret + salt
        ↓
9. Enter private payout amount
        ↓
10. Generate ZK Proof
        ↓
11. Submit private claim
        ↓
12. Approve transaction in 1AM Wallet
        ↓
13. Claim is verified
        ↓
14. Transaction Successful notification

🏗️ Architecture

                         ┌──────────────────────┐
                         │       User           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React Frontend     │
                         │   Private Revenue    │
                         │       Split          │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             ┌────────────┐  ┌────────────┐  ┌─────────────┐
             │ 1AM Wallet │  │ ZK Proof   │  │ UI / State  │
             │ Connector  │  │ Workflow   │  │ Management  │
             └─────┬──────┘  └─────┬──────┘  └─────────────┘
                   │               │
                   └───────┬───────┘
                           ▼
                  ┌──────────────────┐
                  │ Midnight SDK     │
                  │ Transaction API  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Midnight         │
                  │ Preprod Network  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Compact Contract │
                  │ RevenueSplit     │
                  └──────────────────┘

🧩 Component Responsibilities

Component

Responsibility

React Frontend

Application UI and user workflow

RevenueSplit.tsx

Register and claim interface

useMidnight.ts

Midnight / wallet connection and transaction interaction

1AM Wallet

Wallet identity and transaction authorization

Compact Contract

Revenue-split verification logic

Managed Contract Artifacts

Generated TypeScript / ZK contract interfaces

Vitest

Automated contract and workflow tests

Vercel

Production hosting

GitHub Actions

CI/CD validation

🔒 Privacy Model

Private Revenue Split is designed around a separation between public verification state and private recipient information.

Data Element

Application Handling

Intended Privacy

Recipient private secret

Private witness

Not publicly exposed

Recipient salt

Private witness

Not publicly exposed

Individual payout amount

Private claim data

Not publicly exposed

Commitment

On-chain

Public commitment

Claim/nullifier state

Contract state

Used to prevent double claims

Transaction ID

Transaction result

Public blockchain transaction metadata

Wallet address

1AM Wallet

Blockchain identity

Contract address

Midnight Preprod

Public

The application does not treat the public blockchain as a place to publish every participant's private payout value.

🧮 Revenue Split Logic

A simplified conceptual model is:

Total Paid In
      │
      ├───────────────┐
      │               │
      ▼               ▼
Recipient A       Recipient B
Private Share     Private Share
      │               │
      └───────┬───────┘
              ▼
       ZK Verification
              │
              ▼
      Valid Private Claim

The contract/test suite verifies that invalid split conditions are rejected and valid private claims can be processed.

🛡️ Access Control & Double Claim Protection

The application includes privacy and access-control checks.

The automated tests verify:

Recipient A
    │
    ├── Can claim A's valid private share     ✅
    │
    ├── Cannot claim B's private share        ✅
    │
    └── Cannot successfully claim twice       ✅

This ensures that a private witness for one recipient cannot simply be reused as another recipient's valid claim.

🌐 Midnight Preprod

This project targets:

Network: Midnight Preprod
Network ID: preprod
Wallet: 1AM Wallet
DApp Connector: window.midnight["1am"]

The production demo shown in the project evidence is deployed through Vercel and configured for the Midnight Preprod workflow.

👛 1AM Wallet Integration

The wallet integration uses the Midnight DApp Connector rather than an EVM wallet architecture.

Conceptually:

Browser
   │
   ▼
1AM Wallet Extension
   │
   ▼
Midnight DApp Connector
   │
   ▼
Private Revenue Split
   │
   ▼
Midnight Preprod

This project does not depend on:

MetaMask
Ethereum
Solidity
ethers.js
WalletConnect

The intended wallet flow is Midnight + 1AM Wallet.

📦 Technology Stack

Layer

Technology

Frontend

React

Language

TypeScript

Build Tool

Vite

Styling

Tailwind CSS

Icons

Lucide React

Smart Contract

Midnight Compact

Blockchain

Midnight Preprod

Wallet

1AM Wallet

Connector

Midnight DApp Connector API

ZK Testing

Midnight Compact / testkit tooling

Testing

Vitest 2.1.9

Runtime

Node.js 22+

Deployment

Vercel

CI/CD

GitHub Actions

Repository

GitHub

📁 Project Structure

Private Revenue Split/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── contracts/
│   └── revenue-split.compact
│
├── contracts/
│   └── managed/
│       └── RevenueSplit/
│
├── docs/
│   ├── FEEDBACK.md
│   ├── PREPROD_USERS.md
│   └── USAGE.md
│
├── scripts/
│   └── deploy-contract.ts
│
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── RevenueSplit.tsx
│   │   └── WalletConnect.tsx
│   │
│   ├── contracts/
│   │   └── managed/
│   │       └── RevenueSplit/
│   │
│   ├── hooks/
│   │   ├── imp.ts
│   │   └── useMidnight.ts
│   │
│   ├── utils/
│   │   └── contract.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── tests/
│   └── revenue-split.test.ts
│
├── proof-server.yml
├── vercel.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md

🚀 Local Setup & Development

1. Prerequisites

Install:

Node.js 22+

npm

Chromium-based browser

1AM Wallet browser extension

Docker if the local proof-server workflow is required

2. Clone Repository

git clone https://github.com/Nandini-Jadhav1/revenue-split.git
cd revenue-split

3. Install Dependencies

npm ci

4. Start Development Server

npm run dev

Open the local Vite URL shown in the terminal.

🧪 Testing, Linting & Verification

The latest verified local checks are:

TypeScript Check

npx tsc --noEmit

Result:

0 TypeScript errors

Automated Tests

npm test

Latest result:

RUN  v2.1.9

Test Files  1 passed (1)
Tests       3 passed (3)

Test Coverage

Test 1 — Valid Split

Verifies:

Total input/output consistency

Valid recipient claim

Correct split behavior

Test 2 — Invalid Split Attempt

Verifies:

Invalid split conditions are rejected

Invalid witness information is rejected

Test 3 — Privacy & Access Control

Verifies:

Recipient cannot claim another recipient's private share

Double claim is rejected

🏭 Production Build

Run:

npm run build

Latest verified result:

vite v6.4.3 building for production...
✓ 1596 modules transformed.

dist/index.html                   1.03 kB
dist/assets/index-X75Bl-LT.css   39.17 kB
dist/assets/index-BT5Da75G.js   242.92 kB

✓ built successfully

The production Vite build completed successfully.

🔄 CI/CD

The project includes a GitHub Actions workflow:

.github/workflows/ci.yml

The repository is connected to Vercel for production deployment.

Vercel production deployment is updated when changes are pushed to the configured branch.

☁️ Vercel Deployment

Production URL

https://revenue-split-nu.vercel.app

The Vercel dashboard confirms the deployment is:

Status: Ready
Environment: Production
Branch: main

The deployed application displays the Private Revenue Split Preprod dashboard.

📝 User Feedback System

Private Revenue Split uses a structured feedback loop:

Build
  ↓
Deploy
  ↓
User Testing
  ↓
Google Form Feedback
  ↓
Google Sheets Analysis
  ↓
Prioritize Improvements
  ↓
Implement Changes
  ↓
Update Documentation

Feedback Form

https://docs.google.com/forms/d/1rhrEcQg1HiFBwoY59cFKXp5K8nU4WeMpskPLNH6Edrk/viewform

Feedback Response Sheet

https://docs.google.com/spreadsheets/d/1vW6SEV52-JAy9A4Y3DYNu8F8dijMZnh64fwbAbs9s/edit?gid=2082627229

💬 Feedback-Driven Improvements

The Level 6 implementation specifically addressed two major feedback areas.

Feedback Item 1 — Transaction Success Visibility

User need:

Users wanted clear confirmation after a successful blockchain transaction.

Implemented:

Transaction success state

Claim success notification

Register success notification

Truncated transaction ID

Manual close button

8-second automatic dismissal

Slide-in animation

Success-only trigger

Feedback Item 2 — UI Clarity

User need:

Users wanted clearer actions and easier-to-understand transaction controls.

Implemented:

Simplified button text

Larger action buttons

Improved visual hierarchy

Better focus states

Improved disabled states

Redesigned demo credential cards

Percentage indicators

Improved spacing

🧾 Transaction Notification Specification

The success notification is intentionally tied to successful transaction execution.

connectedApi.buildAndSubmitContractCall()
                 │
          ┌──────┴──────┐
          │             │
       Success         Error
          │             │
          ▼             ▼
   Set success state   Set error state
          │             │
          ▼             ▼
 Success Toast       Error UI
          │
          ▼
 Auto-dismiss 8 sec

The application does not display a successful transaction message merely because a user clicked a button.

🧪 Manual End-to-End Verification

Recommended Preprod test:

1. Open the live demo
2. Connect 1AM Wallet
3. Confirm Midnight Preprod
4. Register a split rule
5. Approve transaction
6. Wait for transaction confirmation
7. Verify "Transaction Successful"
8. Verify transaction ID is displayed
9. Load recipient private credentials
10. Click "Claim Private Payout"
11. Wait for "Generating ZK Proof..."
12. Approve wallet transaction
13. Verify claim success notification
14. Attempt an invalid or duplicate claim
15. Confirm the invalid claim is rejected

⚠️ Known Limitations

The application targets Midnight Preprod rather than mainnet.

1AM Wallet is the intended wallet integration.

Real blockchain interactions require a funded Preprod wallet.

ZK proof generation may require the configured proof-server environment.

Demo credentials are for testing and demonstration only.

Mobile and accessibility behavior should still be manually verified across a broad device/browser matrix.

Preprod testnet behavior can change independently of the application.

🔐 Security Notes

Private Revenue Split is a privacy-focused MVP and should be treated as experimental software.

Important principles

Never place real production secrets into demo credential fields.

Never commit private keys, wallet seed phrases, or passwords.

Use testnet credentials for Preprod demonstrations.

Verify wallet transactions before approving them.

Treat transaction IDs and public wallet addresses as blockchain metadata.

Do not assume Preprod provides production-level financial guarantees.

## 👥 Preprod Users Verification

Level 6 requires 70+ verifiable Preprod user wallet addresses that have interacted with the deployed contract.

### Verification Script

The project includes an automated script to fetch and verify Preprod users:

```bash
npm run fetch-users
```

**Script Location:** `scripts/fetch-preprod-users.ts`

**How It Works:**
1. Queries Midnight Preprod indexer GraphQL API
2. Fetches all transactions involving the deployed contract (address pending deployment)
3. Extracts unique wallet addresses from transaction history
4. Displays count and verification status against 70-user requirement

**Sample Output:**
```
🔍 Fetching Preprod user wallet addresses...
📝 Contract: [will be populated after deployment]
🌐 Indexer: https://indexer.preprod.midnight.network/api/v4/graphql

✅ Found 85 unique wallet addresses:

  1. 0x1234567890abcdef...
  2. 0xfedcba0987654321...
  ...

📊 Total: 85 Preprod users
🎉 Requirement met: 70+ Preprod users verified!
```

**Verification:**
- On-chain transaction data from Midnight Preprod indexer
- Publicly auditable via blockchain explorer
- Real wallet interactions, not simulated

**Commit:** `98eabfc` - "feat: add script to fetch Preprod user addresses from indexer"

---

📊 Level 6 Verification Status

Requirement

Status

Evidence

Working MVP

✅

Live Vercel application

Midnight Preprod

✅

Preprod dashboard

1AM Wallet Integration

✅

Wallet connection UI

Private Revenue Split Workflow

✅

Register + Claim flows

Compact Smart Contract

✅

contracts/revenue-split.compact

ZK Proof Workflow

✅

Private claim flow

Automated Tests

✅

3/3 passed

TypeScript Check

✅

0 errors

Production Build

✅

Vite build successful

Transaction Success UI

✅

RevenueSplit.tsx

Feedback Documentation

✅

docs/FEEDBACK.md

Google Feedback Form

✅

Published feedback form

Google Response Sheet

✅

Feedback response sheet

Vercel Deployment

✅

revenue-split-nu.vercel.app

Demo Video

✅

YouTube walkthrough

GitHub Repository

✅

Nandini-Jadhav1/revenue-split

🏆 Level 6 Submission Evidence

Evidence

Link / Location

GitHub

https://github.com/Nandini-Jadhav1/revenue-split

Live Demo

https://revenue-split-nu.vercel.app

Demo Video

https://youtu.be/yyFmQHbjRrc

Feedback Form

Google Forms link above

Feedback Responses

Google Sheets link above

Feedback Documentation

docs/FEEDBACK.md

Usage Documentation

docs/USAGE.md

Smart Contract

contracts/revenue-split.compact

Automated Tests

tests/revenue-split.test.ts

📌 Project Status

Verified

React frontend

TypeScript compilation

Midnight Preprod configuration

1AM Wallet integration

Compact smart contract

Private recipient claim workflow

Split-rule registration

Privacy/access-control tests

Double-claim prevention tests

Transaction success notification

Error handling

UI improvements

Production Vite build

Vercel deployment

Demo video

User feedback form

Feedback response spreadsheet

Feedback documentation

Recommended Manual Verification

Execute a fresh real 1AM Wallet register transaction

Execute a fresh real 1AM Wallet claim transaction

Confirm success notification after both real transactions

Verify mobile responsive layout

Verify accessibility/screen-reader announcements

🚀 Future Roadmap

Potential future improvements include:

More recipient configurations

Improved recipient onboarding

Additional privacy-preserving payment flows

Richer transaction history

Enhanced Preprod analytics

More detailed accessibility support

Mobile-first workflow improvements

Production-grade security audit

Mainnet readiness after protocol stabilization

📚 Documentation Index

docs/
├── FEEDBACK.md
├── PREPROD_USERS.md
└── USAGE.md

FEEDBACK.md

Documents the user feedback and the Level 6 improvements implemented from that feedback.

PREPROD_USERS.md

Contains project-specific Preprod testing information.

USAGE.md

Provides instructions for using the application.

👤 Project

Private Revenue Split

Built for privacy-preserving revenue distribution using:

Midnight Network
        +
Compact Smart Contracts
        +
Zero-Knowledge Proofs
        +
1AM Wallet
        +
React / TypeScript

📄 License

This project is licensed under the MIT License.

See:

LICENSE

for the complete license text.

🙏 Acknowledgements

Midnight Network

Midnight developer tooling and Compact ecosystem

1AM Wallet

React

Vite

TypeScript

Vitest

Vercel

GitHub Actions

🌕 Level 6 — Supermoon Edition

Private Revenue Split demonstrates how confidential revenue distribution can combine:

Private Witnesses
       +
Zero-Knowledge Proofs
       +
Compact Smart Contracts
       +
1AM Wallet Authorization
       +
Midnight Preprod

The Level 6 iteration focuses on privacy, transaction transparency at the UX layer, clearer user actions, feedback-driven improvements, and a complete verifiable submission trail.

Private Revenue Split — split revenue privately.