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

function CopyableField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <code className="flex-1 text-xs font-mono break-all rounded-lg bg-muted px-3 py-2 text-muted-foreground">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="shrink-0 h-8 w-8 p-0"
        >
          {copied
            ? <CheckIcon className="size-3.5 text-emerald-500" />
            : <CopyIcon className="size-3.5" />
          }
        </Button>
      </div>
    </div>
  )
}

export function TransactionDetailModal({ tx, open, onClose }: TransactionDetailModalProps) {
  if (!tx) return null

  const txLink = stellarExpertLink(tx.txHash)
  const senderLink = `https://stellar.expert/explorer/testnet/account/${tx.sender}`

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg rounded-2xl bg-card border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">

          {/* Status + Amount */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Amount</span>
              <p className="text-3xl font-bold tabular-nums mt-1">
                {formatXLM(tx.amount)}{' '}
                <span className="text-lg font-normal text-muted-foreground">XLM</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
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
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Date & Time</span>
            <p className="mt-1 font-medium">{formatTimestamp(tx.timestamp)}</p>
          </div>

          {/* Sender address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Sender Address</span>
              <a
                href={senderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View wallet ↗
              </a>
            </div>
            <CopyableField value={tx.sender} label="sender address" />
          </div>

          {/* Transaction hash */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Transaction Hash</span>
              <a
                href={txLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View on Explorer ↗
              </a>
            </div>
            <CopyableField value={tx.txHash} label="transaction hash" />
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
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
