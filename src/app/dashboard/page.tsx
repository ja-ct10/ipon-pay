'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

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

  // Soroban contract event stream
  useEffect(() => {
    const contractId = process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? ''
    if (!contractId) return

    function onContrib(event: ContribEvent) {
      const xlmAmount = Number(event.amountStroops) / 10_000_000

      setPoolCollected((prev) => prev + xlmAmount)

      setMembers((prev) => {
        const matchExists = prev.some((m) => m.address === event.sender)
        if (!matchExists) return prev
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

      if (state.address && event.sender === state.address) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }

    function onPayout(event: PayoutEvent) {
      setSchedule((prev) =>
        prev.map((cycle) =>
          cycle.cycleNumber === event.cycleNumber
            ? { ...cycle, status: 'completed' as const }
            : cycle,
        ),
      )
      refreshBalance().catch(() => {})
    }

    startEventStream(contractId, onContrib, onPayout)

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
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your group savings overview at a glance.
          </p>
        </motion.div>

        {/* Balance cards — side by side on desktop */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-5 sm:grid-cols-2 mb-6"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <BalanceCard />
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: 'easeOut' }}>
            <PoolBalanceCard />
          </motion.div>
        </motion.div>

        {/* Group stats */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
          className="mb-6"
        >
          <GroupStats data={dynamicGroupData} nextRecipientName={nextRecipientName} isLoading={isLoading} />
        </motion.div>

        {/* Pool progress */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
          className="mb-6"
        >
          <PoolProgress collected={poolCollected} target={target} />
        </motion.div>

        {/* Members */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
        >
          <MemberList members={members} connectedAddress={state.address} />
        </motion.div>
      </main>
      <SuccessConfetti show={showConfetti} onDismiss={() => setShowConfetti(false)} />
    </PageWrapper>
  )
}
