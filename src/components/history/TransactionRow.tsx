import { motion } from 'framer-motion'
import {
  truncateAddress,
  formatXLM,
  formatTimestamp,
  stellarExpertLink,
} from '@/lib/utils'
import type { ContributionTx } from '@/lib/types'

interface TransactionRowProps {
  tx: ContributionTx
}

export function TransactionRow({ tx }: TransactionRowProps) {
  return (
    <motion.tr
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      className="border-b border-border transition-colors"
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
      <td className="px-4 py-3 text-sm">
        <a
          href={stellarExpertLink(tx.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View transaction ${tx.txHash} on Stellar Expert`}
          className="font-mono text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          {truncateAddress(tx.txHash)}
        </a>
      </td>
      <td className="px-4 py-3">
        <span
          aria-label={`Status: ${tx.status}`}
          className={[
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            tx.status === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white',
          ].join(' ')}
        >
          {tx.status === 'success' ? 'Success' : 'Failed'}
        </span>
      </td>
    </motion.tr>
  )
}
