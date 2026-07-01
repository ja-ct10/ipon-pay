'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { TransactionRow } from './TransactionRow'
import { fetchTransactionHistory } from '@/lib/horizon'
import {
  sortTransactions,
  filterTransactions,
  filterByStatus,
} from '@/lib/utils'
import type { ContributionTx } from '@/lib/types'

type StatusFilter = 'all' | 'success' | 'failed'

interface TransactionTableProps {
  address: string
}

// Poll every 10 seconds so the receiver browser sees new transactions automatically
const POLL_INTERVAL_MS = 10_000

export function TransactionTable({ address }: TransactionTableProps) {
  const [txs, setTxs] = useState<ContributionTx[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true)
      setError(null)
      try {
        const raw = await fetchTransactionHistory(address)
        setTxs(sortTransactions(raw))
        setLastRefreshed(new Date())
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load transaction history.',
        )
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [address],
  )

  // Initial load
  useEffect(() => {
    load()
  }, [load])

  // Auto-poll every 15s so receiver sees new contributions without manual refresh
  useEffect(() => {
    const interval = setInterval(() => {
      load(true) // silent — no spinner on background refresh
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  const displayedTxs = filterTransactions(
    filterByStatus(txs, statusFilter),
    search,
  )

  const filterButtons: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Success', value: 'success' },
    { label: 'Failed', value: 'failed' },
  ]

  return (
    <div className="space-y-4">
      {/* Search + filter controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          aria-label="Search transactions by address or hash"
          placeholder="Search by address or tx hash…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Filter transactions by status"
          >
            {filterButtons.map(({ label, value }) => (
              <Button
                key={value}
                variant={statusFilter === value ? 'default' : 'ghost'}
                size="sm"
                aria-label={`Show ${label.toLowerCase()} transactions`}
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(false)}
            disabled={isLoading}
            aria-label="Refresh transaction history"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Last refreshed indicator */}
      {lastRefreshed && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Last updated: {lastRefreshed.toLocaleTimeString()} · auto-refreshes every 10s
        </p>
      )}

      {/* Error state */}
      {error && (
        <p role="alert" className="text-sm text-destructive text-center py-4">
          {error}
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} className="h-10" lines={1} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && displayedTxs.length === 0 && (
        <p className="text-center text-muted-foreground py-10">
          No transactions found
        </p>
      )}

      {/* Table */}
      {!isLoading && displayedTxs.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/7">
          <table
            className="w-full text-left"
            aria-label="Transaction history"
          >
            <thead>
              <tr className="border-b border-border bg-white/3">
                <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sender
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Hash
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedTxs.map((tx) => (
                <TransactionRow key={tx.txHash} tx={tx} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
