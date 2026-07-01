'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { PoolBalanceCard } from '@/components/dashboard/PoolBalanceCard'
import { GroupStats } from '@/components/dashboard/GroupStats'
import { PoolProgress } from '@/components/dashboard/PoolProgress'
import { MemberList } from '@/components/dashboard/MemberList'
import { useWallet } from '@/contexts/WalletContext'
import { GROUP_DATA } from '@/lib/mock-data'
import { fetchPoolMembers, fetchPayoutHistory, fetchXLMBalance } from '@/lib/horizon'
import { deriveSchedule } from '@/lib/utils'
import type { Member, CycleEntry } from '@/lib/types'

const POLL_INTERVAL_MS = 15_000
const MIN_MEMBERS = 2

export default function DashboardPage() {
  const { state } = useWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [schedule, setSchedule] = useState<CycleEntry[]>([])
  const [poolCollected, setPoolCollected] = useState(0)

  const syncFromChain = useCallback(async () => {
    if (!GROUP_DATA.poolAddress) return
    try {
      const [liveMembers, payoutRecipients, poolBalance] = await Promise.all([
        fetchPoolMembers(GROUP_DATA.poolAddress),
        fetchPayoutHistory(GROUP_DATA.poolAddress),
        fetchXLMBalance(GROUP_DATA.poolAddress),
      ])
      setMembers(liveMembers)
      setSchedule(deriveSchedule(liveMembers, payoutRecipients))

      const target = Math.max(liveMembers.length, MIN_MEMBERS) * GROUP_DATA.contributionAmount
      // Pool balance from Horizon = actual current XLM held minus the 1 XLM minimum reserve
      const poolHeld = Math.max(0, parseFloat(poolBalance) - 1)
      setPoolCollected(Math.min(poolHeld, target))
    } catch {
      // non-fatal — keep last known state
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { syncFromChain() }, [syncFromChain])
  useEffect(() => {
    const interval = setInterval(syncFromChain, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [syncFromChain])

  if (!state.isConnected) return null

  const target = Math.max(members.length, MIN_MEMBERS) * GROUP_DATA.contributionAmount
  const nextRecipientName = schedule.find((e) => e.status === 'current')?.recipientName ?? 'TBD'
  const dynamicGroupData = {
    ...GROUP_DATA,
    totalMembers: Math.max(members.length, MIN_MEMBERS),
    targetPoolAmount: target,
  }

  return (
    <PageWrapper>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <BalanceCard />
        <PoolBalanceCard />
        <GroupStats data={dynamicGroupData} nextRecipientName={nextRecipientName} isLoading={isLoading} />
        <PoolProgress collected={poolCollected} target={target} />
        <MemberList members={members} connectedAddress={state.address} />
      </main>
    </PageWrapper>
  )
}
