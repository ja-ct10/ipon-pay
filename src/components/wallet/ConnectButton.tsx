'use client'

import { useRouter } from 'next/navigation'
import { Loader2Icon, WalletIcon, LogOutIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@/contexts/WalletContext'
import { classifyWalletError } from '@/lib/wallet'
import { truncateAddress, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ConnectButtonProps {
  className?: string
  hideProviders?: boolean
}

const WALLET_INSTALL_URLS: Record<string, { name: string; url: string }> = {
  freighter: { name: 'Freighter', url: 'https://freighter.app' },
  xbull: { name: 'xBull', url: 'https://xbull.app' },
  lobstr: { name: 'Lobstr', url: 'https://lobstr.co' },
  albedo: { name: 'Albedo', url: 'https://albedo.link' },
}

export function ConnectButton({ className, hideProviders = false }: ConnectButtonProps) {
  const { state, connectWallet, disconnectWallet } = useWallet()
  const router = useRouter()

  async function handleConnect() {
    try {
      await connectWallet()
    } catch (err: unknown) {
      const category = classifyWalletError(err)
      if (category === 'not_found') {
        toast.error('Wallet not found. Please install it to continue.', { duration: 5000 })
      } else if (category === 'rejected') {
        toast.error('Transaction rejected. You cancelled the signing request.', { duration: 5000 })
      } else {
        toast.error('Wallet error — please try again.', { duration: 5000 })
      }
    }
  }

  function handleDisconnect() {
    disconnectWallet()
    router.push('/')
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

  // Idle / disconnected state — show multi-wallet options below button
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <Button
        onClick={handleConnect}
        aria-label="Connect wallet"
        className="gap-2"
      >
        <WalletIcon className="size-4" aria-hidden="true" />
        Connect Wallet
      </Button>
      {/* Wallet name labels — visible before clicking (Req 1.6) */}
      {!hideProviders && (
        <p className="text-xs text-muted-foreground text-center">
          Freighter · xBull · Lobstr · Albedo
        </p>
      )}
      {/* Wallet-not-found: show install links for all supported wallets (Req 2.4) */}
      {state.error && state.error.toLowerCase().includes('not found') && (
        <div className="flex flex-wrap gap-2 justify-center mt-1" role="alert">
          {Object.values(WALLET_INSTALL_URLS).map(({ name, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300"
            >
              Install {name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
