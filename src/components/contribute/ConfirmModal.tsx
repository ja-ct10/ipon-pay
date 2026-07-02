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
import { TransactionStatusBadge } from '@/components/ui/TransactionStatusBadge'
import { buildPaymentTransaction } from '@/lib/stellar-helper'
import { signWithKit, classifyWalletError, stellarExpertLink } from '@/lib/wallet'
import { submitTransaction } from '@/lib/horizon'
import { truncateAddress, mapStellarError } from '@/lib/utils'
import { useWallet } from '@/contexts/WalletContext'

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
  const { dispatch, state } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    setIsSubmitting(true)
    // Immediately set pending status (Req 4.1)
    dispatch({ type: 'SET_TX_STATUS', status: 'pending' })

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

      // 3. Sign with the active wallet via StellarWalletsKit (Req 3.3, Task 8.1)
      const signedXDR = await signWithKit(txXDR, Networks.TESTNET)

      // 4. Submit to Horizon
      const txHash = await submitTransaction(signedXDR)

      // 5. Set success state and log hash (Req 4.2, 6.5)
      dispatch({ type: 'SET_TX_HASH', hash: txHash })
      dispatch({ type: 'SET_TX_STATUS', status: 'success' })
      console.log(`[IponPay] TX Hash: ${txHash}`)

      // 6. Fire-and-forget Soroban recording via server-side API route (Req 3.2, 3.3)
      // Pool keypair signs on server — no second wallet prompt needed
      const now = BigInt(Math.floor(Date.now() / 1000))
      const amountStroops = BigInt(100_000_000) // 10 XLM in stroops
      void fetch('/api/record-contribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender,
          amountStroops: amountStroops.toString(),
          timestamp: now.toString(),
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json() as { contractTxHash?: string }
            if (data.contractTxHash) {
              dispatch({ type: 'SET_CONTRACT_TX_HASH', hash: data.contractTxHash })
              console.log(`[IponPay] TX Hash: ${data.contractTxHash}`)
            }
          }
        })
        .catch((e) => console.error('[ConfirmModal] Soroban recording failed:', e))

      // 7. Notify success with explorer link
      toast.success('Contribution sent! View on Stellar Expert', {
        action: {
          label: 'View',
          onClick: () => window.open(stellarExpertLink(txHash), '_blank'),
        },
      })

      onSuccess(txHash)
      onClose()
    } catch (err: unknown) {
      // Set failed status (Req 4.3)
      dispatch({ type: 'SET_TX_STATUS', status: 'fail' })

      const category = classifyWalletError(err)
      if (category === 'rejected') {
        toast.error('Transaction rejected. You cancelled the signing request.', { duration: 5000 })
      } else if (category === 'not_found') {
        toast.error('Wallet not found. Please install it to continue.', { duration: 5000 })
      } else if (category === 'insufficient_balance') {
        toast.error('Insufficient balance — you need at least 11 XLM (10 XLM contribution + 1 XLM reserve).', { duration: 5000 })
      } else {
        // Try Stellar result code mapping before falling back to generic message
        const message = err instanceof Error ? err.message : String(err)
        const knownCodes = [
          'op_underfunded', 'tx_bad_seq', 'op_no_destination',
          'tx_insufficient_fee', 'op_line_full', 'tx_bad_auth', 'tx_failed',
        ]
        const matchedCode = knownCodes.find((code) =>
          message.toLowerCase().includes(code),
        )
        toast.error(matchedCode ? mapStellarError(matchedCode) : 'Wallet error — please try again.', { duration: 5000 })
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
            <span className="font-mono text-xs" title={poolAddress}>
              {truncateAddress(poolAddress)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated fee</span>
            <span>0.00001 XLM</span>
          </div>

          {/* Transaction status area (Req 4.1–4.3, 6.1, 6.3) */}
          {state.txStatus !== null && (
            <div className="space-y-1.5 pt-1">
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
