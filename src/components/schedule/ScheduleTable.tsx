'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CycleRow } from './CycleRow'
import type { CycleEntry } from '@/lib/types'
import { GROUP_DATA } from '@/lib/mock-data'
import { stellarExpertLink } from '@/lib/utils'

interface ScheduleTableProps {
  entries: CycleEntry[]
  connectedAddress?: string | null
  poolCollected?: number
  targetPoolAmount?: number
}

export function ScheduleTable({
  entries,
  connectedAddress,
  poolCollected = 0,
  targetPoolAmount = GROUP_DATA.targetPoolAmount,
}: ScheduleTableProps) {
  const [isPayingOut, setIsPayingOut] = useState(false)

  const poolIsFull = poolCollected >= targetPoolAmount

  async function handlePayout(entry: CycleEntry) {
    setIsPayingOut(true)
    try {
      const amount = targetPoolAmount.toFixed(7)
      const res = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress: entry.recipientAddress,
          amount,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(`Payout failed: ${data.error ?? 'Unknown error'}`)
        return
      }

      toast.success(
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            🎉 Payout sent!
          </span>
          <span className="text-xs text-muted-foreground">
            {targetPoolAmount.toFixed(2)} XLM has been transferred to your wallet.
          </span>
          <a
            href={stellarExpertLink(data.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors mt-0.5"
          >
            View on Stellar Expert →
          </a>
        </div>,
        { duration: 8000 },
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payout failed'
      toast.error(`Payout failed: ${message}`)
    } finally {
      setIsPayingOut(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-white/7">
        <table className="w-full text-left" aria-label="Paluwagan cycle schedule">
          <thead>
            <tr className="border-b border-border bg-white/3">
              <th
                scope="col"
                className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Cycle
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Week
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Recipient
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              // Show "Claim Payout" only when:
              // 1. Pool is full
              // 2. This row is the current cycle
              // 3. The connected wallet is the recipient
              const showPayoutButton =
                poolIsFull &&
                entry.status === 'current' &&
                !!connectedAddress &&
                connectedAddress === entry.recipientAddress

              return (
                <CycleRow
                  key={entry.cycleNumber}
                  entry={entry}
                  showPayoutButton={showPayoutButton}
                  onPayout={() => handlePayout(entry)}
                  isPayingOut={isPayingOut}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
