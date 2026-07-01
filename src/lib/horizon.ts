import * as StellarSdk from '@stellar/stellar-sdk'
import type { ContributionTx, Member } from './types'
import { mapStellarError } from './utils'

const horizonUrl =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? 'https://horizon-testnet.stellar.org'

/**
 * Fetch the native XLM balance for a Stellar address from Horizon Testnet.
 * Returns "0" if the account does not exist yet (unfunded testnet account).
 * @throws on network errors other than account-not-found
 */
export async function fetchXLMBalance(address: string): Promise<string> {
  const server = new StellarSdk.Horizon.Server(horizonUrl)
  try {
    const account = await server.loadAccount(address)
    const native = account.balances.find((b) => b.asset_type === 'native')
    return native ? native.balance : '0'
  } catch (err: unknown) {
    // Use proper SDK NotFoundError for account-not-found (404) case
    if (err instanceof StellarSdk.NotFoundError) {
      return '0'
    }
    throw err
  }
}

/**
 * Fetch the most recent payment operations for `address` (up to 50),
 * mapping each Horizon record to a ContributionTx shape.
 * Filters to payment operations only; non-payment operations are discarded.
 * @returns Array of ContributionTx sorted descending by timestamp
 * @throws on network errors
 */
export async function fetchTransactionHistory(
  address: string,
): Promise<ContributionTx[]> {
  const server = new StellarSdk.Horizon.Server(horizonUrl)
  try {
    const payments = await server
      .payments()
      .forAccount(address)
      .order('desc')
      .limit(50)
      .call()

    return payments.records
      .filter((r) => r.type === 'payment')
      .map((r) => {
        const p = r as StellarSdk.Horizon.ServerApi.PaymentOperationRecord
        return {
          txHash: p.transaction_hash,
          sender: p.from ?? '',
          amount: p.amount,
          timestamp: p.created_at,
          status: 'success' as const,
        }
      })
  } catch (err: unknown) {
    // Account not found = no transaction history yet
    if (err instanceof StellarSdk.NotFoundError) {
      return []
    }
    // Re-throw all other network errors so callers can handle them
    throw err
  }
}

/**
 * Submit a signed transaction XDR to Horizon.
 * @returns The confirmed transaction hash on success
 * @throws Error with a human-readable message (via mapStellarError) on failure
 */
export async function submitTransaction(signedXDR: string): Promise<string> {
  const server = new StellarSdk.Horizon.Server(horizonUrl)
  const networkPassphrase =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'MAINNET'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET

  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(
      signedXDR,
      networkPassphrase,
    ) as StellarSdk.Transaction
    const result = await server.submitTransaction(tx)
    return result.hash
  } catch (err: unknown) {
    // NetworkError exposes a typed response via getResponse()
    if (err instanceof StellarSdk.NetworkError) {
      const response = err.getResponse()
      const data = response.data

      // TransactionFailed errors carry result_codes in extras
      if (
        data &&
        data.status === 400 &&
        'extras' in data &&
        data.extras
      ) {
        const extras = (data as StellarSdk.Horizon.HorizonApi.ErrorResponseData.TransactionFailed).extras
        const code =
          extras?.result_codes?.operations?.[0] ??
          extras?.result_codes?.transaction ??
          'tx_failed'
        throw new Error(mapStellarError(code))
      }

      // Other network errors (rate limit, server error, etc.)
      const code = response.statusText ?? 'tx_failed'
      throw new Error(mapStellarError(code))
    }

    throw err
  }
}

/**
 * Fetch outgoing payments FROM the pool address (these are payouts to recipients).
 * Returns the addresses that have already received a payout, in order.
 */
export async function fetchPayoutHistory(poolAddress: string): Promise<string[]> {
  if (!poolAddress) return []
  try {
    const server = new StellarSdk.Horizon.Server(horizonUrl)
    const payments = await server
      .payments()
      .forAccount(poolAddress)
      .order('asc')
      .limit(50)
      .call()

    // Outgoing payments: sender === poolAddress
    return payments.records
      .filter((r) => r.type === 'payment')
      .map((r) => r as StellarSdk.Horizon.ServerApi.PaymentOperationRecord)
      .filter((p) => p.from === poolAddress)
      .map((p) => p.to)
  } catch {
    return []
  }
}

/**
 * Derive the dynamic member list from pool transactions.
 * Each unique sender address that sent XLM to the pool is a "member".
 * Members are returned in chronological order (first contributor = m1, etc.).
 * The member's "name" is their truncated address (e.g. "GCWQ...6YU6").
 */
export async function fetchPoolMembers(poolAddress: string): Promise<Member[]> {
  const txs = await fetchTransactionHistory(poolAddress)

  // Inline truncation to avoid circular import concerns
  function truncate(addr: string) {
    return addr.slice(0, 4) + '...' + addr.slice(-4)
  }

  // txs are desc by timestamp — reverse to get oldest first
  const ascending = [...txs].reverse()

  const seen = new Set<string>()
  const ordered: { address: string; paidAt: string; amount: string }[] = []

  for (const tx of ascending) {
    if (!seen.has(tx.sender) && tx.sender !== poolAddress) {
      seen.add(tx.sender)
      ordered.push({ address: tx.sender, paidAt: tx.timestamp, amount: tx.amount })
    }
  }

  return ordered.map((m, i) => ({
    id: `m${i + 1}`,
    name: truncate(m.address),
    address: m.address,
    hasPaid: true,
    paidAt: m.paidAt,
  }))
}

/**
 * Calculate how much XLM has been contributed to the pool in the CURRENT round.
 * 
 * A "round" ends when the pool makes an outgoing payout.
 * We walk the payment history chronologically, reset the counter on each payout,
 * and return the running total of contributions since the last payout.
 * 
 * This is independent of the pool's raw XLM balance (which starts high due to
 * the initial funding transaction).
 */
export async function fetchCurrentRoundCollected(poolAddress: string): Promise<number> {
  if (!poolAddress) return 0
  try {
    const server = new StellarSdk.Horizon.Server(horizonUrl)
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
        // Outgoing payout — this marks the end of a round, reset
        runningTotal = 0
      } else {
        // Incoming contribution from a member
        runningTotal += parseFloat(p.amount)
      }
    }

    return runningTotal
  } catch {
    return 0
  }
}
