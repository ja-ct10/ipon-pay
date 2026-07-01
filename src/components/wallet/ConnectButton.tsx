'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon, WalletIcon, LogOutIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@/contexts/WalletContext'
import { truncateAddress, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ConnectButtonProps {
  className?: string
}

export function ConnectButton({ className }: ConnectButtonProps) {
  const { state, connectWallet, disconnectWallet } = useWallet()
  const router = useRouter()
  const [freighterMissing, setFreighterMissing] = useState(false)

  async function handleConnect() {
    setFreighterMissing(false)
    try {
      await connectWallet()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet.'

      if (message.toLowerCase().includes('freighter not installed')) {
        setFreighterMissing(true)
        return
      }

      if (message.toLowerCase().includes('cancelled')) {
        toast.error('Wallet connection cancelled.')
        return
      }

      toast.error(message)
    }
  }

  function handleDisconnect() {
    disconnectWallet()
    router.push('/')
  }

  // Freighter not found state
  if (freighterMissing) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-amber-500',
          className,
        )}
        role="alert"
      >
        <span>Freighter not found.</span>
        <a
          href="https://freighter.app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 font-medium hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Install
        </a>
      </div>
    )
  }

  // Connected state
  if (state.isConnected && state.address) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span
          className="text-sm font-address text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/25 tabular-nums"
          title={state.address}
          aria-label={`Connected wallet: ${state.address}`}
        >
          {truncateAddress(state.address)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          aria-label="Disconnect wallet"
          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <LogOutIcon className="size-3.5 mr-1" aria-hidden="true" />
          Disconnect
        </Button>
      </div>
    )
  }

  // Loading state
  if (state.isLoading) {
    return (
      <Button
        disabled
        aria-label="Connecting wallet…"
        aria-busy="true"
        className={cn('gap-2', className)}
      >
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        Connecting…
      </Button>
    )
  }

  // Idle / disconnected state
  return (
    <Button
      onClick={handleConnect}
      aria-label="Connect Freighter wallet"
      className={cn('gap-2', className)}
    >
      <WalletIcon className="size-4" aria-hidden="true" />
      Connect Wallet
    </Button>
  )
}
