import { cn } from '@/lib/utils'
import type { CycleEntry } from '@/lib/types'

interface CycleRowProps {
  entry: CycleEntry
  showPayoutButton?: boolean
  onPayout?: () => void
  isPayingOut?: boolean
}

export function CycleRow({
  entry,
  showPayoutButton = false,
  onPayout,
  isPayingOut = false,
}: CycleRowProps) {
  const isCompleted = entry.status === 'completed'
  const isCurrent = entry.status === 'current'
  const isUpcoming = entry.status === 'upcoming'

  return (
    <tr
      className={cn(
        'border-b border-border transition-colors',
        isCurrent && 'bg-emerald-500/8',
        isUpcoming && 'border border-dashed border-border',
      )}
    >
      <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
        {entry.cycleNumber}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.week}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {isCurrent && (
            <span
              className="relative flex size-3"
              aria-hidden="true"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
            </span>
          )}
          <span className={cn(isCompleted && 'text-muted-foreground')}>
            {isCompleted ? <s>{entry.recipientName}</s> : entry.recipientName}
          </span>
          {isCurrent && (
            <span
              aria-label="Active Beneficiary"
              className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            >
              Active Beneficiary
            </span>
          )}
          {showPayoutButton && (
            <button
              onClick={onPayout}
              disabled={isPayingOut}
              className={cn(
                'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold transition-colors',
                'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
              aria-label="Claim payout to your Freighter wallet"
            >
              {isPayingOut ? 'Sending…' : 'Claim Payout'}
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          aria-label={`${entry.status === 'current' ? 'Current beneficiary' : entry.status}: ${entry.recipientName}`}
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            isCompleted && 'bg-muted text-muted-foreground',
            isCurrent && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
            isUpcoming && 'bg-secondary text-secondary-foreground',
          )}
        >
          {entry.status}
        </span>
      </td>
    </tr>
  )
}
