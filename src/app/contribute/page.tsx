'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { ContributionForm } from '@/components/contribute/ContributionForm'
import { useWallet } from '@/contexts/WalletContext'
import { GROUP_DATA } from '@/lib/mock-data'
import { fetchTransactionHistory } from '@/lib/horizon'

export default function ContributePage() {
  const { state, refreshBalance } = useWallet()
  const [alreadyPaid, setAlreadyPaid] = useState(false)

  const checkPaidStatus = useCallback(async () => {
    if (!state.address || !GROUP_DATA.poolAddress) return
    try {
      const txs = await fetchTransactionHistory(GROUP_DATA.poolAddress)
      setAlreadyPaid(txs.some((tx) => tx.sender === state.address))
    } catch { /* non-fatal */ }
  }, [state.address])

  useEffect(() => { checkPaidStatus() }, [checkPaidStatus])

  const handleSuccess = useCallback((_txHash: string) => {
    refreshBalance()
    setAlreadyPaid(true)
  }, [refreshBalance])

  if (!state.isConnected) return null

  return (
    <PageWrapper>
      <main className="container mx-auto px-4 py-8 max-w-lg space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Contribute</h1>
        <BalanceCard />
        <ContributionForm onSuccess={handleSuccess} alreadyPaid={alreadyPaid} />
      </main>
    </PageWrapper>
  )
}
