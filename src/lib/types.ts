export interface WalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  // ── new fields (multi-wallet-contract-integration) ────────────────────────
  walletType: string | null;        // e.g. 'freighter' | 'xbull' | 'lobstr' | 'albedo'
  txStatus: 'pending' | 'success' | 'fail' | null;
  lastTxHash: string | null;        // Horizon payment tx hash
  contractTxHash: string | null;    // Soroban record_contribution tx hash
}

export interface Member {
  id: string;
  name: string;
  address: string;
  hasPaid: boolean;
  paidAt: string | null;
}

export interface ContributionTx {
  txHash: string;
  sender: string;
  recipient?: string;
  amount: string;
  timestamp: string;
  status: 'success' | 'failed';
  type: 'contribution' | 'payout';
}

export interface CycleEntry {
  cycleNumber: number;
  week: string;
  recipientName: string;
  recipientAddress: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface GroupData {
  name: string;
  contributionAmount: number;
  totalMembers: number;
  currentCycle: number;
  poolAddress: string;
  targetPoolAmount: number;
}

export interface ContributionRecord {
  sender: string;
  amount_stroops: bigint;
  timestamp: bigint;
}
