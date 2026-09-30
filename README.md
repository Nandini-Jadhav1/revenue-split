# 🔐 Private Revenue Split

## 🔒 Privacy Model

| Data | Visibility |
|---|---|
| `totalPaidIn` | Public — on-chain |
| `totalSplitOut` | Public — on-chain |
| `splitCommitment` | Public — on-chain |
| `claimedNullifiers` | Public — on-chain (spent set) |
| Recipient secret | **Private** — never on-chain |
| Recipient salt | **Private** — never on-chain |
| Individual claim amount | **Private** — proved in ZK, never disclosed |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 22+
- 1AM Wallet browser extension, configured for **Preprod**

### Install & Run
```bash
git clone https://github.com/Nandini-Jadhav1/revenue-split.git
cd revenue-split
npm install
npm run dev
```
Opens at `http://localhost:5173`.

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

---

## 🧪 Usage

### Connect Wallet
1. Install the [1AM extension](https://1am.xyz) and set it to **Preprod**
2. Click **Connect 1AM Wallet**
3. Approve the connection popup

### Register a Split
1. Go to **Register Split Rule**
2. Enter recipient secret, salt, and private share amount
3. Click **Register Commitment On-Chain**

### Claim a Payout
1. Go to **Claim Private Cut**
2. Enter your private secret and salt
3. Enter the claim amount
4. Click **Prove & Claim Payout** — a ZK proof is generated and submitted on-chain

Full walkthrough: [docs/USAGE.md](docs/USAGE.md)

---

## 🔄 CI/CD

Four-job GitHub Actions workflow on every push and PR to `main`:

| Job | Action |
|---|---|
| TypeScript Type Check | `npx tsc --noEmit` |
| Unit Tests | `npm test` (Vitest) |
| Production Build | `npm run build` + artifact upload |
| Security Audit | `npm audit --audit-level=high` |

---

## ✅ Submission Checklist

| Requirement | Status |
|---|---|
| Working MVP live on Preprod | ✅ [revenue-split-nu.vercel.app](https://revenue-split-nu.vercel.app) |
| README + setup + usage docs | ✅ This file + `docs/USAGE.md` |
| CI/CD pipeline on product repo | ✅ `.github/workflows/ci.yml` |
| Product X profile | ✅ [@jadhav_nan99910](https://x.com/jadhav_nan99910) |
| Minimum 15 meaningful commits | ✅ See commit history |
| Preprod contract address | ✅ 0xb1eb2448c2164288361542720e1b8a822a28c5f05bd1a1456fb24fa293536a65 |
| Demo video | ✅ [Watch here](https://youtu.be/yyFmQHbjRrc) |

---

## 📄 License

[MIT](LICENSE)
