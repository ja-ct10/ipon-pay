'use client'

import { useState } from 'react'
import { ExternalLinkIcon, CopyIcon, CheckIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatXLM, formatTimestamp, stellarExpertLink } from '@/lib/utils'
import type { ContributionTx } from '@/lib/types'

interface TransactionDetailModalProps {
  tx: ContributionTx | null
  open: boolean
  onClose: () => void
}

// Read the contract ID from env for the smart contract Stellar Expert link
const CONTRACT_ID = process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? ''

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className="shrink-0 h-8 w-8 p-0"
    >
      {copied
        ? <CheckIcon className="size-3.5 text-emerald-500" />
        : <CopyIcon className="size-3.5" />
      }
    </Button>
  )
}

export function TransactionDetailModal({ tx, open, onClose }: TransactionDetailModalProps) {
  if (!tx) return null

  const txLink = stellarExpertLink(tx.txHash)
  const senderLink = `https://stellar.expert/explorer/testnet/account/${tx.sender}`
  const contractLink = CONTRACT_ID
    ? `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`
    : null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg rounded-2xl bg-card border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">

          {/* Amount + Status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
              <p className="text-3xl font-bold tabular-nums mt-1">
                {formatXLM(tx.amount)}{' '}
                <span className="text-lg font-normal text-muted-foreground">XLM</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
              <div className="mt-1.5">
                <Badge className={
                  tx.status === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }>
                  {tx.status === 'success' ? 'Success' : 'Failed'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Date & Time</p>
            <p className="mt-1 font-medium">{formatTimestamp(tx.timestamp)}</p>
          </div>

          {/* Sender address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sender Address</p>
              <a
                href={senderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View wallet ↗
              </a>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono break-all rounded-lg bg-muted px-3 py-2 text-muted-foreground">
                {tx.sender}
              </code>
              <CopyButton value={tx.sender} />
            </div>
          </div>

          {/* Transaction hash */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Transaction Hash</p>
              <a
                href={txLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View on Explorer ↗
              </a>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono break-all rounded-lg bg-muted px-3 py-2 text-muted-foreground">
                {tx.txHash}
              </code>
              <CopyButton value={tx.txHash} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <a
              href={txLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 transition-colors"
            >
              <ExternalLinkIcon className="size-4" aria-hidden />
              View Transaction on Stellar Expert
            </a>
            <a
              href={senderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 transition-colors"
            >
              <ExternalLinkIcon className="size-4" aria-hidden />
              View Sender Wallet Balance
            </a>
            {contractLink && (
              <a
                href={contractLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 transition-colors"
              >
                <ExternalLinkIcon className="size-4" aria-hidden />
                View Smart Contract on Stellar Expert
              </a>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
