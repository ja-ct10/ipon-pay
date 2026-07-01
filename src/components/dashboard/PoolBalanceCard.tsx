'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExternalLinkIcon, RefreshCwIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchXLMBalance } from '@/lib/horizon'
import { formatXLM } from '@/lib/utils'
import { GROUP_DATA } from '@/lib/mock-data'

export function PoolBalanceCard() {
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const poolAddress = GROUP_DATA.poolAddress

  const refresh = useCallback(async () => {
    if (!poolAddress) return
    setLoading(true)
    try {
      const bal = await fetchXLMBalance(poolAddress)
      setBalance(bal)
    } catch {
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [poolAddress])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <Card className="rounded-2xl border-white/7 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Pool Balance</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh pool balance"
            className="h-7 w-7 p-0"
          >
            <RefreshCwIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          </Button>
          {poolAddress && (
            <a
              href={`https://stellar.expert/explorer/testnet/account/${poolAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View pool on Stellar Expert"
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLinkIcon className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">
          {loading ? '…' : balance !== null ? `${formatXLM(balance)} XLM` : '—'}
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-mono truncate" title={poolAddress}>
          {poolAddress ? `${poolAddress.slice(0, 6)}…${poolAddress.slice(-6)}` : 'Not configured'}
        </p>
      </CardContent>
    </Card>
  )
}
