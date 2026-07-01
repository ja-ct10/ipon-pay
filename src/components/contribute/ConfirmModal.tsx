'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Networks } from '@stellar/stellar-sdk'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { buildPaymentTransaction } from '@/lib/stellar-helper'
import { signWithFreighter } from '@/lib/wallet'
import { submitTransaction } from '@/lib/horizon'
import { recordContribution } from '@/lib/soroban-client'
import { truncateAddress, stellarExpertLink, mapStellarError } from '@/lib/utils'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  sender: string
  poolAddress: string
  onSuccess: (txHash: string) => void
}

export function ConfirmModal({
  open,
  onClose,
  sender,
  poolAddress,
  onSuccess,
}: ConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    setIsSubmitting(true)
    try {
      // 1. Build the transaction
      const tx = await buildPaymentTransaction(
        sender,
        poolAddress,
        '10.0000000',
        'testnet',
      )

      // 2. Get XDR from the transaction object
      const txXDR = tx.toXDR()

      // 3. Sign with Freighter
      const signedXDR = await signWithFreighter(txXDR, Networks.TESTNET)

      // 4. Submit to Horizon
      const txHash = await submitTransaction(signedXDR)

      // 5. Fire-and-forget Soroban recording
      const now = BigInt(Math.floor(Date.now() / 1000))
      const amountStroops = BigInt(100_000_000) // 10 XLM in stroops
      recordContribution({ sender, amount_stroops: amountStroops, timestamp: now })

      // 6. Notify success with explorer link
      toast.success('Contribution sent! View on Stellar Expert', {
        action: {
          label: 'View',
          onClick: () => window.open(stellarExpertLink(txHash), '_blank'),
        },
      })

      onSuccess(txHash)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)

      if (message.toLowerCase().includes('cancelled')) {
        toast.error('Transaction cancelled by user.')
      } else {
        // Try to extract a Stellar result code from the message, otherwise show
        // the raw message mapped through our error dictionary.
        const knownCodes = [
          'op_underfunded',
          'tx_bad_seq',
          'op_no_destination',
          'tx_insufficient_fee',
          'op_line_full',
          'tx_bad_auth',
          'tx_failed',
        ]
        const matchedCode = knownCodes.find((code) =>
          message.toLowerCase().includes(code),
        )
        toast.error(matchedCode ? mapStellarError(matchedCode) : message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    toast.info('Transaction cancelled.')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isSubmitting) onClose() }}>
      <DialogContent showCloseButton={!isSubmitting} className="bg-card border border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Contribution</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">10 XLM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Destination</span>
            <span
              className="font-mono text-xs"
              title={poolAddress}
            >
              {truncateAddress(poolAddress)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated fee</span>
            <span>0.00001 XLM</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
