'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { WalletIcon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { useWallet } from '@/contexts/WalletContext'
import { formatXLM, cn } from '@/lib/utils'

interface BalanceCardProps {
  className?: string
}

export function BalanceCard({ className }: BalanceCardProps) {
  const { state, refreshBalance } = useWallet()
  const { balance, isLoading, error } = state
  const fetchAttempts = useRef(0)

  useEffect(() => {
    if (state.isConnected && balance === null && !isLoading) {
      fetchAttempts.current += 1
      refreshBalance()
    }
    // Run only on mount — refreshBalance is stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return <SkeletonCard lines={1} className={className} />
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('w-full', className)}
    >
      <div className="rounded-2xl border border-white/7 bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: label + balance */}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Wallet Balance
            </span>

            {error ? (
              <div
                role="alert"
                className="flex items-center gap-2 mt-1 text-destructive"
              >
                <AlertCircleIcon
                  aria-hidden="true"
                  className="size-4 shrink-0"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium">Balance unavailable</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 rounded-lg h-7 text-xs"
                  onClick={() => {
                    fetchAttempts.current += 1
                    refreshBalance()
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <p className="text-4xl font-bold tabular-nums leading-tight">
                {formatXLM(balance ?? '0')}{' '}
                <span className="text-2xl text-muted-foreground font-semibold">
                  XLM
                </span>
              </p>
            )}

            <span className="text-xs text-muted-foreground mt-0.5">
              on Stellar Testnet
            </span>
          </div>

          {/* Right: wallet icon */}
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500 shrink-0">
            <WalletIcon
              aria-hidden="true"
              className="size-8"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
