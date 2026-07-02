'use client'

import { useState, useCallback } from 'react'
import { CheckIcon, CopyIcon, UserCircle2Icon, ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionStatusBadge } from '@/components/ui/TransactionStatusBadge'
import { useWallet } from '@/contexts/WalletContext'
import { hasInsufficientFunds } from '@/lib/wallet'
import { GROUP_DATA } from '@/lib/mock-data'
import { ConfirmModal } from './ConfirmModal'
import { SuccessConfetti } from './SuccessConfetti'

interface ContributionFormProps {
  onSuccess: (txHash: string) => void
  alreadyPaid?: boolean
}

const CONTRIBUTION_AMOUNT = 10
const RESERVE = 1

export function ContributionForm({ onSuccess, alreadyPaid = false }: ContributionFormProps) {
  const { state } = useWallet()
  const { balance, address: senderAddress } = state

  const [showModal, setShowModal] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [copied, setCopied] = useState(false)

  const poolAddress = GROUP_DATA.poolAddress
  const displayAddress = senderAddress
    ? senderAddress.slice(0, 4) + '...' + senderAddress.slice(-4)
    : null

  const balanceNum = parseFloat(balance ?? '0')
  const insufficient = hasInsufficientFunds(balanceNum, CONTRIBUTION_AMOUNT, RESERVE)
  const canSend = !insufficient && !!poolAddress

  function handleCopy() {
    if (!senderAddress) return
    navigator.clipboard.writeText(senderAddress).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSuccess = useCallback((txHash: string) => {
    setShowCelebration(true)
    onSuccess(txHash)
    setTimeout(() => setShowCelebration(false), 3000)
  }, [onSuccess])

  return (
    <>
      <div className="space-y-5 rounded-2xl border border-white/10 bg-card p-6 text-sm">
        {/* Wallet identity */}
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
          alreadyPaid
            ? 'bg-emerald-500/10 border border-emerald-500/20'
            : 'bg-blue-500/10 border border-blue-500/20'
        }`}>
          <UserCircle2Icon className={`size-5 shrink-0 ${alreadyPaid ? 'text-emerald-500' : 'text-blue-400'}`} aria-hidden />
          <div>
            <p className={`font-semibold font-mono text-sm ${alreadyPaid ? 'text-emerald-400' : 'text-blue-300'}`}>
              {displayAddress ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {alreadyPaid
                ? '✓ You have contributed this cycle — you are in the member list'
                : 'Send 10 XLM to join — you will be added to members automatically'}
            </p>
          </div>
        </div>

        {/* Sender address */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Your Wallet (Sender)</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all">{senderAddress ?? '—'}</code>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy} aria-label="Copy your wallet address" className="shrink-0">
              {copied ? <CheckIcon className="size-3.5 text-emerald-500" aria-hidden /> : <CopyIcon className="size-3.5" aria-hidden />}
            </Button>
          </div>
        </div>

        {/* Pool address */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pool Address (Destination)</label>
          <div className="flex items-center gap-2">
            <p className="flex-1 rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all text-muted-foreground" title={poolAddress}>
              {poolAddress || <span className="text-destructive">Not configured</span>}
            </p>
            {poolAddress && (
              <a
                href={`https://stellar.expert/explorer/testnet/account/${poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View pool balance on Stellar Expert"
                className="shrink-0 inline-flex items-center justify-center size-8 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLinkIcon className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Click ↗ to verify pool balance on Stellar Expert.</p>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
          <span className="text-xs text-muted-foreground font-medium">Contribution Amount</span>
          <span className="text-xl font-bold">{CONTRIBUTION_AMOUNT} <span className="text-sm font-normal text-muted-foreground">XLM</span></span>
        </div>

        {insufficient && <p role="alert" className="text-xs text-destructive">Insufficient balance — you need at least 11 XLM (10 XLM contribution + 1 XLM reserve).</p>}
        {!poolAddress && <p role="alert" className="text-xs text-destructive">Pool address not configured</p>}

        <Button className="w-full rounded-full" disabled={!canSend} onClick={() => setShowModal(true)}>
          Send 10 XLM to Pool
        </Button>
      </div>

      {/* Transaction status badges — persistent from wallet state (Req 4.6, 4.8, 4.9, 6.1, 6.3) */}
      {state.txStatus !== null && (
        <div className="space-y-2 mt-4">
          <TransactionStatusBadge
            status={state.txStatus}
            txHash={state.lastTxHash}
            label="Payment TX"
          />
          {state.contractTxHash && (
            <TransactionStatusBadge
              status="success"
              txHash={state.contractTxHash}
              label="Contract TX"
            />
          )}
        </div>
      )}

      {senderAddress && poolAddress && (
        <ConfirmModal open={showModal} onClose={() => setShowModal(false)} sender={senderAddress} poolAddress={poolAddress} onSuccess={handleSuccess} />
      )}
      <SuccessConfetti show={showCelebration} onDismiss={() => setShowCelebration(false)} />
    </>
  )
}
