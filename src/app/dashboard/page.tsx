'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { PoolBalanceCard } from '@/components/dashboard/PoolBalanceCard'
import { GroupStats } from '@/components/dashboard/GroupStats'
import { PoolProgress } from '@/components/dashboard/PoolProgress'
import { MemberList } from '@/components/dashboard/MemberList'
import { SuccessConfetti } from '@/components/contribute/SuccessConfetti'
import { useWallet } from '@/contexts/WalletContext'
import { GROUP_DATA } from '@/lib/mock-data'
import { fetchPoolMembers, fetchPayoutHistory, fetchCurrentRoundCollected } from '@/lib/horizon'
import { deriveSchedule, updateMemberStatus } from '@/lib/utils'
import { startEventStream, stopEventStream } from '@/lib/contract-events'
import type { ContribEvent, PayoutEvent } from '@/lib/contract-events'
import type { Member, CycleEntry } from '@/lib/types'

const POLL_INTERVAL_MS = 15_000
const MIN_MEMBERS = 2

export default function DashboardPage() {
  const { state, refreshBalance } = useWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [schedule, setSchedule] = useState<CycleEntry[]>([])
  const [poolCollected, setPoolCollected] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const syncFromChain = useCallback(async () => {
    if (!GROUP_DATA.poolAddress) return
    try {
      const [liveMembers, payoutRecipients, currentRoundCollected] = await Promise.all([
        fetchPoolMembers(GROUP_DATA.poolAddress),
        fetchPayoutHistory(GROUP_DATA.poolAddress),
        fetchCurrentRoundCollected(GROUP_DATA.poolAddress),
      ])
      setMembers(liveMembers)
      setSchedule(deriveSchedule(liveMembers, payoutRecipients))

      const target = Math.max(liveMembers.length, MIN_MEMBERS) * GROUP_DATA.contributionAmount
      setPoolCollected(Math.min(currentRoundCollected, target))
    } catch {
      // non-fatal — keep last known state
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial Horizon sync + 15s polling
  useEffect(() => { syncFromChain() }, [syncFromChain])
  useEffect(() => {
    const interval = setInterval(syncFromChain, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [syncFromChain])

  // Soroban contract event stream (Req 5.1, 5.7, 5.8)
  useEffect(() => {
    const contractId = process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? ''
    if (!contractId) return

    function onContrib(event: ContribEvent) {
      const xlmAmount = Number(event.amountStroops) / 10_000_000

      // Update pool collected amount (Req 5.2)
      setPoolCollected((prev) => prev + xlmAmount)

      // Update matching member's paid status (Req 5.2)
      setMembers((prev) => {
        const matchExists = prev.some((m) => m.address === event.sender)
        if (!matchExists) return prev  // Req 5.9: unknown sender — only update pool
        const syntheticTx = {
          txHash: event.id,
          sender: event.sender,
          amount: (xlmAmount).toFixed(7),
          timestamp: new Date(Number(event.timestamp) * 1000).toISOString(),
          status: 'success' as const,
          type: 'contribution' as const,
        }
        return updateMemberStatus(prev, syntheticTx)
      })

      // Trigger confetti for the connected user's own contribution (Req 5.6)
      if (state.address && event.sender === state.address) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }

    function onPayout(event: PayoutEvent) {
      // Find the matching cycle and mark it completed (Req 5.3)
      setSchedule((prev) =>
        prev.map((cycle) =>
          cycle.cycleNumber === event.cycleNumber
            ? { ...cycle, status: 'completed' as const }
            : cycle,
        ),
      )
      // Refresh wallet balance after a payout (Req 5.3)
      refreshBalance().catch(() => {})
    }

    startEventStream(contractId, onContrib, onPayout)

    // Stop stream on unmount (Req 5.8)
    return () => stopEventStream()
  }, [state.address, refreshBalance])

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
      <SuccessConfetti show={showConfetti} onDismiss={() => setShowConfetti(false)} />
    </PageWrapper>
  )
}
