'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ScheduleTable } from '@/components/schedule/ScheduleTable'
import { useWallet } from '@/contexts/WalletContext'
import { GROUP_DATA } from '@/lib/mock-data'
import { fetchPoolMembers, fetchTransactionHistory } from '@/lib/horizon'
import { sortTransactions, deriveSchedule } from '@/lib/utils'
import type { CycleEntry } from '@/lib/types'

const MIN_MEMBERS = 2

export default function SchedulePage() {
  const { state } = useWallet()
  const [poolCollected, setPoolCollected] = useState(0)
  const [schedule, setSchedule] = useState<CycleEntry[]>([])
  const [targetPoolAmount, setTargetPoolAmount] = useState(MIN_MEMBERS * GROUP_DATA.contributionAmount)

  const syncPool = useCallback(async () => {
    if (!GROUP_DATA.poolAddress) return
    try {
      const members = await fetchPoolMembers(GROUP_DATA.poolAddress)
      setSchedule(deriveSchedule(members))

      const target = Math.max(members.length, MIN_MEMBERS) * GROUP_DATA.contributionAmount
      setTargetPoolAmount(target)

      const txs = await fetchTransactionHistory(GROUP_DATA.poolAddress)
      const total = sortTransactions(txs).reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
      setPoolCollected(Math.min(total, target))
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => {
    syncPool()
    const interval = setInterval(syncPool, 15_000)
    return () => clearInterval(interval)
  }, [syncPool])

  if (!state.isConnected) return null

  return (
    <PageWrapper>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pool: <strong>{poolCollected.toFixed(2)}</strong> / {targetPoolAmount} XLM
            {poolCollected >= targetPoolAmount && schedule.length > 0 && (
              <span className="ml-2 text-emerald-400 font-semibold">✓ Ready to payout!</span>
            )}
          </p>
        </div>
        <ScheduleTable
          entries={schedule}
          connectedAddress={state.address}
          poolCollected={poolCollected}
          targetPoolAmount={targetPoolAmount}
        />
      </main>
    </PageWrapper>
  )
}
