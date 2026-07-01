# 💰 IponPay

> **A blockchain-powered Paluwagan savings platform built on the Stellar network**

IponPay brings the centuries-old Filipino rotating savings tradition (Paluwagan) onto the Stellar blockchain. Members contribute a fixed amount of XLM each cycle into a shared pool, and the full pool is paid out to one member at a time — fully transparent, fully on-chain, and verifiable by anyone.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contract-purple)](https://soroban.stellar.org)

> 📸 **Screenshots** — Replace the placeholder images below with actual screenshots after deployment.

![Dashboard — Pool progress, member list, and balances](./public/placeholder-dashboard.png)

![Contribute — Send 10 XLM to the pool](./public/placeholder-contribute.png)

![History — Real-time transaction log with Stellar Expert links](./public/placeholder-history.png)

![Schedule — Payout rotation and Claim Payout button](./public/placeholder-schedule.png)

---

## 🎯 What is IponPay?

IponPay is a **decentralized Paluwagan platform** that allows a group of people to:

- **Contribute XLM** — Send your fixed 10 XLM contribution to the shared pool each cycle
- **Track the Pool** — Watch the pool fill up in real time as members contribute
- **Receive Payouts** — When the pool is full, the designated cycle recipient claims the full amount directly to their wallet
- **Verify Everything** — Every transaction is recorded on the Stellar blockchain and linked to Stellar Expert

### Key Features

✨ **Self-Registering Members**

- No accounts or sign-ups needed — connect your Freighter wallet and you're in
- Any wallet that contributes to the pool is automatically added to the member list

💰 **Live Pool Tracking**

- Pool balance fetched directly from Stellar Horizon in real time
- Progress bar updates automatically as each member contributes (polls every 15 seconds)
- Pool balance visible on both Dashboard and Contribute pages with a direct Stellar Expert link

📋 **Dynamic Payout Schedule**

- Schedule is derived automatically from contribution order (first to contribute = first to receive)
- "Claim Payout" button appears for the current cycle recipient when the pool is full
- Payouts sent directly from pool to recipient wallet via server-side Stellar transaction

🔒 **Blockchain Verified**

- All contributions submitted to Stellar Testnet via Horizon API
- Each transaction recorded in a Soroban smart contract (`IponPayContract`)
- Every tx hash links to Stellar Expert for independent verification

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Freighter Wallet** — [Install extension](https://freighter.app) (Chrome / Edge / Firefox)
- **Testnet XLM** — Free from [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
- **Rust + Stellar CLI** _(optional, for contract deployment)_ — [stellar.org/developers](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)

### Installation

```bash
# Clone the repository
git clone https://github.com/ja-ct10/ipon-pay.git
cd ipon-pay

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Get Testnet XLM

1. Install the Freighter wallet extension and create a wallet
2. Switch Freighter to **Testnet** mode in Settings
3. Copy your Stellar address
4. Visit [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test)
5. Paste your address and click **Get test network lumens**
6. You'll receive 10,000 testnet XLM — enough to test multiple contribution cycles

---

## 📖 How It Works

### 1. Connect Your Wallet

Click **Connect Wallet** on the landing page. The app uses Freighter browser extension to:

- Request wallet authorization
- Retrieve your public key (Stellar G... address)
- Fetch your XLM balance from Horizon Testnet
- Set a session cookie for route protection

### 2. View the Dashboard

Once connected, the Dashboard shows:

- **Your XLM Balance** — real-time balance from Horizon
- **Pool Balance** — current XLM held in the shared pool (live, with Stellar Expert link)
- **Group Stats** — group name, member count, contribution amount, current cycle
- **Pool Progress** — `X / Y XLM collected` progress bar, auto-refreshes every 15s
- **Members List** — all wallets that have contributed, with "You" badge on your row

### 3. Contribute to the Pool

Navigate to **Contribute**:

1. Your wallet address is shown as the sender
2. The pool address (`GBQF...QDEH`) is the fixed destination — no manual entry needed
3. Click **Send 10 XLM to Pool** → a confirmation modal shows amount, destination, and estimated fee
4. Approve in Freighter → transaction is submitted to Stellar Testnet
5. On success: confetti animation + toast with Stellar Expert link
6. Your wallet automatically appears in the Members list on the Dashboard

### 4. Verify Pool Received Funds

On the Contribute page, click the **↗ icon** next to the pool address. This opens Stellar Expert where you can see all incoming transactions to the pool address — proof that the XLM arrived.

### 5. Claim the Payout

Navigate to **Schedule**:

- The schedule shows the payout order (derived from contribution order)
- The current cycle recipient is highlighted with a pulsing indicator
- When the pool is full, the **"Claim Payout"** button appears — but only for the wallet matching the current recipient address
- Click it → the pool sends the full amount directly to your Freighter wallet via a server-signed Stellar transaction

---

## 🏗️ Architecture

```
Browser (Next.js 16 App Router)
├── Freighter Extension  →  wallet auth + transaction signing
├── Stellar Horizon API  →  balances, payment history, tx submission
└── Soroban Smart Contract  →  on-chain contribution record (fire-and-forget)
```

**Key design decisions:**

- **No backend database** — all state derived from Stellar Horizon in real time
- **Self-registering members** — any wallet that pays into the pool is a member; no admin needed
- **Pool secret server-side only** — `POOL_SECRET_KEY` never exposed to the browser; payouts happen via `/api/payout` Next.js route

---

## 📁 Project Structure

```
ipon-pay/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── dashboard/page.tsx        # Dashboard (protected)
│   │   ├── contribute/page.tsx       # Contribution form (protected)
│   │   ├── history/page.tsx          # Pool transaction history (protected)
│   │   ├── schedule/page.tsx         # Payout schedule + Claim Payout (protected)
│   │   └── api/payout/route.ts       # Server-side payout API (signs with POOL_SECRET_KEY)
│   ├── components/
│   │   ├── dashboard/                # BalanceCard, PoolBalanceCard, GroupStats, PoolProgress, MemberList
│   │   ├── contribute/               # ContributionForm, ConfirmModal, SuccessConfetti
│   │   ├── history/                  # TransactionTable, TransactionRow
│   │   ├── schedule/                 # ScheduleTable, CycleRow, CompletionBanner
│   │   ├── wallet/                   # ConnectButton, ConnectWalletPrompt
│   │   └── layout/                   # Navbar, PageWrapper, Providers
│   ├── contexts/
│   │   └── WalletContext.tsx         # Global wallet state (useReducer)
│   └── lib/
│       ├── horizon.ts                # Horizon API: balances, history, submit, fetchPoolMembers
│       ├── soroban-client.ts         # Soroban RPC: recordContribution, recordPayout (fire-and-forget)
│       ├── stellar-helper.ts         # buildPaymentTransaction
│       ├── wallet.ts                 # Freighter API wrappers
│       ├── mock-data.ts              # Static group metadata (pool address from env)
│       ├── types.ts                  # TypeScript interfaces
│       └── utils.ts                  # Pure helpers + deriveSchedule
├── contracts/
│   └── ipon-pay-contract/            # Soroban Rust smart contract
│       └── src/lib.rs                # record_contribution, record_payout, get_contributions, get_payouts
├── proxy.ts                          # Next.js 16 route guard (wallet_connected cookie)
└── .env.local                        # Environment variables (not committed — see .gitignore)
```

---

## 🔗 Smart Contract

The Soroban smart contract (`contracts/ipon-pay-contract/`) records contributions and payouts on-chain:

```rust
// ContributionRecord: sender address, amount in stroops, Unix timestamp
record_contribution(env, sender, amount_stroops, timestamp)
get_contributions(env) -> Vec<ContributionRecord>

// PayoutRecord: recipient address, amount in stroops, cycle number, Unix timestamp
// Called by the pool account (server-side) after each successful Horizon payout
record_payout(env, caller, recipient, amount_stroops, cycle_number, timestamp)
get_payouts(env) -> Vec<PayoutRecord>
```

**Build and deploy:**

```bash
# Build WASM (use cargo directly — stellar CLI 27 wasm32v1-none requires VS Build Tools on Windows)
cargo build --target wasm32-unknown-unknown --release \
  --manifest-path contracts/ipon-pay-contract/Cargo.toml

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/ipon_pay_contract.wasm \
  --network testnet \
  --source pool-account
```

Both Soroban calls are **fire-and-forget** — a failed RPC call does not affect the Horizon payment settlement.

**Deployed Contract (Testnet):**

- Contract ID: `CDB7SE7O5VMN7DQSKCHYG6TVXTDJWULYKXZTSZQVO4DGRGYRFIQSJ44P`
- [View Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDB7SE7O5VMN7DQSKCHYG6TVXTDJWULYKXZTSZQVO4DGRGYRFIQSJ44P)

---

## 🧪 Running Tests

```bash
# Run all property-based tests (fast-check)
npm test

# Type check
npx tsc --noEmit --skipLibCheck

# Build
npm run build
```

Tests cover utility functions with property-based testing using `fast-check`:

- Address truncation consistency
- XLM balance formatting
- Pool progress calculation
- Transaction sort order and filter correctness
- Insufficient funds guard

---

## 🛠️ Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Framework      | Next.js 16 (App Router)                 |
| Language       | TypeScript 5                            |
| Styling        | Tailwind CSS v4 + shadcn/ui             |
| Animations     | Framer Motion                           |
| Blockchain     | Stellar Testnet                         |
| Wallet         | Freighter (`@stellar/freighter-api` v6) |
| Horizon Client | `@stellar/stellar-sdk` v16              |
| Smart Contract | Soroban (Rust)                          |
| Testing        | Vitest + fast-check (property-based)    |
| Deployment     | Vercel                                  |

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on submitting pull requests and reporting issues.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

<p align="center">Built with ❤️ on the Stellar network · <a href="https://stellar.expert/explorer/testnet/account/GBQFOMWQPFJ5FTYXOASSVQOQ2W4XD7MXYGRFDZB7E52VXOW2ZQIGDQEH">View Pool on Stellar Expert</a></p>
