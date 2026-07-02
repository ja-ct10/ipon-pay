import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Member, ContributionTx } from './types';

// shadcn/ui class merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Requirement 1.3 — truncate Stellar public key
export function truncateAddress(address: string, start = 4, end = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// Requirement 2.2 — format XLM balance to exactly 2 decimal places
export function formatXLM(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '0.00';
  return n.toFixed(2);
}

// Requirement 5.4 — format ISO timestamp to readable format
export function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Requirement 4.5 — pool progress as percentage [0, 100]
export function calculateProgress(collected: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((collected / target) * 100, 100);
}

// Requirement 3.6 — check if balance is insufficient
export function hasInsufficientFunds(
  balance: number,
  amount: number,
  reserve: number,
): boolean {
  return balance < amount + reserve;
}

// Requirement 3.8 — map Stellar error codes to human-readable messages
export function mapStellarError(code: string): string {
  const errorMap: Record<string, string> = {
    op_underfunded: 'Insufficient XLM balance to complete this contribution.',
    tx_bad_seq: 'Transaction sequence error. Please refresh and try again.',
    op_no_destination: 'Destination account not found on the Stellar network.',
    tx_insufficient_fee: 'Transaction fee too low. Please try again.',
    op_line_full: 'The destination account cannot receive more of this asset.',
    tx_bad_auth:
      'Transaction authorization failed. Please reconnect your wallet.',
    tx_failed: 'Transaction failed. Please try again.',
  };
  return Object.prototype.hasOwnProperty.call(errorMap, code) ? errorMap[code] : 'Transaction failed. Please try again.';
}

// Requirement 5.2 — update member payment status
export function updateMemberStatus(
  members: Member[],
  tx: ContributionTx,
): Member[] {
  return members.map((member) =>
    member.address === tx.sender
      ? { ...member, hasPaid: true, paidAt: tx.timestamp }
      : member,
  );
}

// Requirement 6.1 — sort transactions descending by timestamp
export function sortTransactions(txs: ContributionTx[]): ContributionTx[] {
  return [...txs].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

// Requirement 6.4 — filter transactions by search query
export function filterTransactions(
  txs: ContributionTx[],
  query: string,
): ContributionTx[] {
  const q = query.toLowerCase();
  return txs.filter(
    (tx) =>
      tx.sender.toLowerCase().includes(q) ||
      tx.txHash.toLowerCase().includes(q) ||
      (tx.recipient && tx.recipient.toLowerCase().includes(q)),
  );
}

// Requirement 6.5 — filter transactions by status
export function filterByStatus(
  txs: ContributionTx[],
  status: 'all' | 'success' | 'failed',
): ContributionTx[] {
  if (status === 'all') return txs;
  return txs.filter((tx) => tx.status === status);
}

// Requirement 6.6 — filter transactions by type (contribution vs payout)
export function filterByType(
  txs: ContributionTx[],
  type: 'all' | 'contribution' | 'payout',
): ContributionTx[] {
  if (type === 'all') return txs;
  return txs.filter((tx) => tx.type === type);
}

// Stellar Expert link helper
export function stellarExpertLink(
  hash: string,
  network = 'testnet',
): string {
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}

// Dynamic schedule derivation from on-chain member list
import type { CycleEntry } from './types';

/**
 * Derive the payout schedule for the CURRENT round of the Paluwagan.
 *
 * A Paluwagan cycles indefinitely — after all N members receive a payout once,
 * the rotation restarts for round 2, round 3, etc.
 *
 * @param members          - Ordered member list (join order = payout order)
 * @param payoutRecipients - All historical payout recipient addresses (ordered, oldest first)
 */
export function deriveSchedule(members: Member[], payoutRecipients: string[] = []): CycleEntry[] {
  if (members.length === 0) return []

  const N = members.length
  const totalPayouts = payoutRecipients.length

  // Which round we are on (1-based) and where within that round
  const currentRound = Math.floor(totalPayouts / N) + 1
  const positionInRound = totalPayouts % N // payouts completed in the current round

  return members.map((member, i) => {
    let status: 'completed' | 'current' | 'upcoming'
    if (i < positionInRound) {
      status = 'completed'
    } else if (i === positionInRound) {
      status = 'current'
    } else {
      status = 'upcoming'
    }

    return {
      cycleNumber: (currentRound - 1) * N + i + 1, // global ever-incrementing cycle number
      week: `Round ${currentRound}, Cycle ${i + 1}`,
      recipientName: member.name,
      recipientAddress: member.address,
      status,
    }
  })
}
