# 💰 IponPay

> **A blockchain-powered Paluwagan savings platform built on the Stellar network**

IponPay brings the centuries-old Filipino rotating savings tradition (Paluwagan) onto the Stellar blockchain. Members contribute a fixed amount of XLM each cycle into a shared pool, and the full pool is paid out to one member at a time — fully transparent, fully on-chain, and verifiable by anyone.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contract-purple)](https://soroban.stellar.org)
[![CI](https://github.com/ja-ct10/ipon-pay/actions/workflows/ci.yml/badge.svg)](https://github.com/ja-ct10/ipon-pay/actions/workflows/ci.yml)

Live Demo link: https://iponpay.vercel.app/

<img width="1918" height="1013" alt="image" src="https://github.com/user-attachments/assets/ddb85791-01c0-48df-ac53-ef4cdbc5e1a9" />

<img width="1918" height="1012" alt="image" src="https://github.com/user-attachments/assets/3cec521d-09a2-4ac0-968d-98d0c3a416ed" />

<img width="1918" height="1018" alt="image" src="https://github.com/user-attachments/assets/1cef9677-1fdf-49de-b320-e837d7cc1884" />

<img width="1918" height="1015" alt="image" src="https://github.com/user-attachments/assets/e25c9032-b661-40b1-a609-754fe4d62f63" />

<img width="1918" height="1020" alt="image" src="https://github.com/user-attachments/assets/720133c3-0be4-4ba1-83de-bbe96d467b10" />

<img width="1918" height="1011" alt="image" src="https://github.com/user-attachments/assets/359eea71-cb4e-4778-976c-790696bc36a1" />

<img width="1918" height="1013" alt="image" src="https://github.com/user-attachments/assets/c383a532-4c32-4f8e-bca0-7fe91b6a8416" />

<img width="1918" height="1007" alt="image" src="https://github.com/user-attachments/assets/4028f16e-0871-402c-96da-08423cd03f2c" />

<img width="1918" height="1012" alt="image" src="https://github.com/user-attachments/assets/587f32f6-dd89-4c77-8d94-f4df5f90f059" />

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

- Contract ID: `CAQT4K4DWKWK45TR7FPBZFOJXLZAPWZXQGOPQYNIKH5PXOUH52YPNXY7`
- [View Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAQT4K4DWKWK45TR7FPBZFOJXLZAPWZXQGOPQYNIKH5PXOUH52YPNXY7)

<img width="1918" height="1012" alt="image" src="https://github.com/user-attachments/assets/ebdee382-6038-43b4-8d33-8e6d7b7d8bf2" />

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

## 🔄 CI/CD Pipeline

IponPay uses GitHub Actions for continuous integration and deployment.

**Pipeline:** [View on GitHub Actions](https://github.com/ja-ct10/ipon-pay/actions/workflows/ci.yml)

The CI pipeline runs automatically on every push to `main` and on all pull requests:

| Job             | What it does                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `test`          | Installs dependencies, runs 35+ property-based tests (vitest + fast-check), type-checks with tsc, and builds the Next.js app |
| `contract-test` | Compiles the Soroban Rust contract, runs 2 on-chain unit tests, and builds the WASM binary                                   |

Both jobs run in parallel. All checks must pass before merging to `main`.

<img width="1918" height="1015" alt="image" src="https://github.com/user-attachments/assets/3c55b0c8-19cb-427e-bce3-5188c6f27c4b" />

<img width="1918" height="1018" alt="image" src="https://github.com/user-attachments/assets/c50e64a3-4d37-47e7-82b3-b42cde886746" />

<img width="1918" height="1017" alt="image" src="https://github.com/user-attachments/assets/04f4a7ab-c52f-483c-8ec4-d3b38e98f74d" />

---

## 🛠️ Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Framework      | Next.js 16 (App Router)                              |
| Language       | TypeScript 5                                         |
| Styling        | Tailwind CSS v4 + shadcn/ui                          |
| Animations     | Framer Motion                                        |
| Blockchain     | Stellar Testnet                                      |
| Wallet         | StellarWalletsKit (Freighter, xBull, Lobstr, Albedo) |
| Horizon Client | `@stellar/stellar-sdk` v16                           |
| Smart Contract | Soroban (Rust)                                       |
| Testing        | Vitest + fast-check (property-based)                 |
| Deployment     | Vercel                                               |

---

## 🔌 Multi-Wallet Support

IponPay uses [StellarWalletsKit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) to support four wallet providers through a single unified "Connect Wallet" button — no per-wallet code required:

- **[Freighter](https://freighter.app)** — Browser extension wallet for Chrome/Edge/Firefox
- **[xBull](https://xbull.app)** — Browser extension and web wallet
- **[Lobstr](https://lobstr.co)** — Mobile and web wallet
- **[Albedo](https://albedo.link)** — Web-based Stellar signer (no install required)

Clicking "Connect Wallet" opens the built-in WalletSelector modal so users can pick from all four providers. The selected wallet is remembered across page reloads via `localStorage`.

### Wallet Selection

<img width="1918" height="1013" alt="image" src="https://github.com/user-attachments/assets/234e9f8f-c66f-4ae3-95a8-f83fa14fce97" />

<img width="1918" height="1012" alt="image" src="https://github.com/user-attachments/assets/4453f364-d57b-49af-a428-656a01aee8a3" />

---

## 🔍 Transaction Hash

Every transaction hash can be viewed in the History page upon clicking the specific row data.

This is for the record_payout with transaction hash and is verifiable on Stellar Expert:

<img width="1918" height="1013" alt="image" src="https://github.com/user-attachments/assets/9ee775df-5978-465c-99c5-5f3b32b9d428" />

<img width="1918" height="1013" alt="image" src="https://github.com/user-attachments/assets/8f49ed07-21d2-4061-aa77-e2e339a78aac" />

This is for the record_contribution with transaction hash and is verifiable on Stellar Expert:

<img width="1918" height="1001" alt="image" src="https://github.com/user-attachments/assets/048fe1d4-670f-4a36-9158-32c15c8996df" />

<img width="1918" height="1013" alt="image" src="https://github.com/user-attachments/assets/9c8fffe8-6386-46a6-854c-d59234ea2913" />

<img width="1918" height="1017" alt="image" src="https://github.com/user-attachments/assets/b24de781-946f-41fc-be23-563163ea8ac7" />

---

## ⚙️ Setup

### Step-by-step

1. **Clone the repository**
   ```bash
   git clone https://github.com/ja-ct10/ipon-pay.git && cd ipon-pay
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create `.env.local`** in the project root with the required variables (see table below)
4. **Run the development server**
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable Name                     | Purpose                                                                | Example Value                                              |
| --------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SOROBAN_CONTRACT_ID` | Deployed Soroban contract address                                      | `CAQT4K4DWKWK45TR7FPBZFOJXLZAPWZXQGOPQYNIKH5PXOUH52YPNXY7` |
| `NEXT_PUBLIC_POOL_ADDRESS`        | Pool's Stellar public key                                              | `GBQFOMWQPFJ5FTYXOASSVQOQ2W4XD7MXYGRFDZB7E52VXOW2ZQIGDQEH` |
| `NEXT_PUBLIC_STELLAR_NETWORK`     | Network to use                                                         | `TESTNET`                                                  |
| `POOL_SECRET_KEY`                 | Pool's Stellar secret key (server-side only, never exposed to browser) | `<redacted>`                                               |
| `NEXT_PUBLIC_SOROBAN_RPC_URL`     | Soroban RPC endpoint                                                   | `https://soroban-testnet.stellar.org`                      |
| `NEXT_PUBLIC_HORIZON_URL`         | Horizon API endpoint                                                   | `https://horizon-testnet.stellar.org`                      |

---

### 📱 Mobile Responsive UI

<img width="1918" height="1017" alt="image" src="https://github.com/user-attachments/assets/32d6fff9-6eb2-4263-9557-3a211226d7aa" />

<img width="1918" height="1017" alt="image" src="https://github.com/user-attachments/assets/68fe6f2f-4a34-4f2c-a7bc-c0eb49aaa891" />

<img width="1918" height="1017" alt="image" src="https://github.com/user-attachments/assets/6a3d5206-4e88-4351-a446-50ef4351b8bd" />

<img width="1918" height="1018" alt="image" src="https://github.com/user-attachments/assets/79256cff-53cc-4461-91bd-c00bead0ab5f" />


### 🔄 CI/CD Pipeline Running

<img width="1918" height="1020" alt="image" src="https://github.com/user-attachments/assets/1c281c15-50e4-42c5-95a8-48a775132dfd" />

### 🧪 Test Output (37 passing tests)

<img width="1918" height="1020" alt="image" src="https://github.com/user-attachments/assets/9ff9cf25-adeb-480f-ac18-de591ab8e501" />

### 🎬 Demo Video

https://drive.google.com/file/d/1nPBrxuOB2pl12eXOmO5mFmWFkfvkmGPy/view?usp=sharing

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on submitting pull requests and reporting issues.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

<p align="center">Built with ❤️ on the Stellar network · <a href="https://stellar.expert/explorer/testnet/account/GBQFOMWQPFJ5FTYXOASSVQOQ2W4XD7MXYGRFDZB7E52VXOW2ZQIGDQEH">View Pool on Stellar Expert</a></p>
