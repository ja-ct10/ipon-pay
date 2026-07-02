'use client'

import { stellarExpertLink } from '@/lib/wallet'

interface TransactionStatusBadgeProps {
  status: 'pending' | 'success' | 'fail' | null
  txHash?: string | null
  label?: string
}

/**
 * Displays a colour-coded transaction status badge.
 * - null: renders nothing
 * - pending: amber pulsing badge
 * - success: green badge; if txHash provided, links to Stellar Expert
 * - fail: red badge
 */
export function TransactionStatusBadge({
  status,
  txHash,
  label = 'TX',
}: TransactionStatusBadgeProps) {
  if (status === null) return null

  if (status === 'pending') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 animate-pulse"
        role="status"
        aria-label={`${label} pending`}
      >
        <span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" />
        {label} · Pending
      </span>
    )
  }

  if (status === 'success') {
    const shortHash = txHash
      ? `${txHash.slice(0, 6)}…${txHash.slice(-4)}`
      : null

    if (txHash) {
      return (
        <a
          href={stellarExpertLink(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${label} ${txHash} on Stellar Expert`}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors"
        >
          <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          {label} · Success{shortHash ? ` · ${shortHash}` : ''}
        </a>
      )
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
        role="status"
        aria-label={`${label} success`}
      >
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
        {label} · Success
      </span>
    )
  }

  // fail
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25"
      role="status"
      aria-label={`${label} failed`}
    >
      <span className="size-1.5 rounded-full bg-red-400" aria-hidden="true" />
      {label} · Failed
    </span>
  )
}
