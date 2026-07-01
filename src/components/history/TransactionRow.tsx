'use client'

import { motion } from 'framer-motion'
import { truncateAddress, formatXLM, formatTimestamp } from '@/lib/utils'
import type { ContributionTx } from '@/lib/types'

interface TransactionRowProps {
  tx: ContributionTx
  onClick: (tx: ContributionTx) => void
}

export function TransactionRow({ tx, onClick }: TransactionRowProps) {
  return (
    <motion.tr
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      className="border-b border-border transition-colors cursor-pointer select-none"
      onClick={() => onClick(tx)}
      tabIndex={0}
      role="button"
      aria-label={`View details for transaction ${truncateAddress(tx.txHash)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(tx)
        }
      }}
    >
      <td className="px-4 py-3 text-sm font-mono">
        {truncateAddress(tx.sender)}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums">
        {formatXLM(tx.amount)} XLM
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatTimestamp(tx.timestamp)}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
        {truncateAddress(tx.txHash)}
      </td>
      <td className="px-4 py-3">
        <span
          aria-label={`Status: ${tx.status}`}
          className={[
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            tx.status === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20',
          ].join(' ')}
        >
          {tx.status === 'success' ? 'Success' : 'Failed'}
        </span>
      </td>
    </motion.tr>
  )
}
