'use client'

import { PageWrapper } from '@/components/layout/PageWrapper'
import { TransactionTable } from '@/components/history/TransactionTable'
import { useWallet } from '@/contexts/WalletContext'
import { GROUP_DATA } from '@/lib/mock-data'
import { truncateAddress } from '@/lib/utils'

export default function HistoryPage() {
  const { state } = useWallet()

  if (!state.isConnected) return null

  return (
    <PageWrapper>
      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pool Transaction History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All contributions to pool{' '}
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {truncateAddress(GROUP_DATA.poolAddress)}
            </code>
          </p>
        </div>
        <TransactionTable address={GROUP_DATA.poolAddress} />
      </main>
    </PageWrapper>
  )
}
