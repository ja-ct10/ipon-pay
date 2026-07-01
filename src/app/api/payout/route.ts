import * as StellarSdk from '@stellar/stellar-sdk'
import { recordPayout } from '@/lib/soroban-client'

const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET

// Target contribution per member per round (10 XLM)
const CONTRIBUTION_AMOUNT = 10
// Minimum number of members required before a payout is valid
const MIN_MEMBERS = 2

/**
 * Calculate the current round's collected amount server-side by replaying
 * the pool's payment history from Horizon. Resets on every outgoing payout.
 * This prevents a client from inflating the payout amount.
 */
async function getServerSidePayoutAmount(
  poolAddress: string,
  targetPerRound: number,
): Promise<{ amount: number; valid: boolean }> {
  const server = new StellarSdk.Horizon.Server(HORIZON_URL)
  const payments = await server
    .payments()
    .forAccount(poolAddress)
    .order('asc')
    .limit(200)
    .call()

  let runningTotal = 0
  for (const record of payments.records) {
    if (record.type !== 'payment') continue
    const p = record as StellarSdk.Horizon.ServerApi.PaymentOperationRecord
    if (p.from === poolAddress) {
      // Outgoing payout marks end of a round — reset counter
      runningTotal = 0
    } else {
      // Incoming contribution
      runningTotal += parseFloat(p.amount)
    }
  }

  return {
    amount: runningTotal,
    // Small tolerance (0.1 XLM) to account for floating-point rounding
    valid: runningTotal >= targetPerRound - 0.1,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recipientAddress, amount } = body

    if (!recipientAddress) {
      return Response.json({ error: 'Missing recipientAddress' }, { status: 400 })
    }

    // Validate recipient is a valid Stellar public key (G + 55 base32 chars)
    if (!/^G[A-Z2-7]{55}$/.test(recipientAddress)) {
      return Response.json({ error: 'Invalid recipient address' }, { status: 400 })
    }

    // Validate client-supplied amount is a sane number (basic sanity check only —
    // the actual payout amount is calculated server-side below)
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > 10000) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const poolSecret = process.env.POOL_SECRET_KEY
    const poolAddress = process.env.NEXT_PUBLIC_POOL_ADDRESS

    if (!poolSecret || !poolAddress) {
      return Response.json(
        { error: 'Pool not configured on server' },
        { status: 500 },
      )
    }

    // --- Server-side payout amount calculation ---
    // Derive targetPerRound from the pool address: count unique senders to get
    // the number of members, then multiply by the fixed contribution amount.
    // For safety we use at least MIN_MEMBERS.
    const server = new StellarSdk.Horizon.Server(HORIZON_URL)
    const paymentsForMembers = await server
      .payments()
      .forAccount(poolAddress)
      .order('asc')
      .limit(200)
      .call()

    const memberAddresses = new Set<string>()
    for (const record of paymentsForMembers.records) {
      if (record.type !== 'payment') continue
      const p = record as StellarSdk.Horizon.ServerApi.PaymentOperationRecord
      if (p.from !== poolAddress) {
        memberAddresses.add(p.from)
      }
    }
    const memberCount = Math.max(memberAddresses.size, MIN_MEMBERS)
    const targetPerRound = memberCount * CONTRIBUTION_AMOUNT

    const { amount: serverAmount, valid } = await getServerSidePayoutAmount(
      poolAddress,
      targetPerRound,
    )

    if (!valid) {
      return Response.json(
        { error: 'Pool not yet full for this round' },
        { status: 400 },
      )
    }

    const keypair = StellarSdk.Keypair.fromSecret(poolSecret)

    // Load the pool account to get the current sequence number
    const account = await server.loadAccount(poolAddress)

    // Build payment: pool → recipient using the server-calculated amount
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: recipientAddress,
          asset: StellarSdk.Asset.native(),
          amount: serverAmount.toFixed(7),
        }),
      )
      .setTimeout(180)
      .build()

    // Sign with pool keypair (server-side — secret never leaves the server)
    tx.sign(keypair)

    // Submit to Horizon testnet
    const result = await server.submitTransaction(tx)

    // Fire-and-forget: record the payout on-chain via Soroban contract.
    // Small delay lets the Soroban RPC sync the pool account's updated sequence number
    // after the Horizon payout transaction consumed it.
    if (poolSecret) {
      setTimeout(() => {
        void recordPayout({
          poolAddress,
          poolSecret,
          recipient: recipientAddress,
          amountStroops: BigInt(Math.round(serverAmount * 10_000_000)),
          cycleNumber: 1,
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
        })
      }, 5000) // wait 5s for Soroban RPC to catch up
    }

    return Response.json({ txHash: result.hash })
  } catch (err: unknown) {
    console.error('[payout] error:', err)
    const message = err instanceof Error ? err.message : 'Payout failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
