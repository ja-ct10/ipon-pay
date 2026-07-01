import * as StellarSdk from '@stellar/stellar-sdk'
import type { ContributionRecord } from './types'

const rpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org'

// Read contract ID at call time (not module load time) so env var updates are picked up
function getContractId(): string {
  return process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? ''
}

export async function recordContribution(
  record: ContributionRecord,
): Promise<void> {
  const contractId = getContractId()
  if (!contractId) {
    console.warn(
      '[soroban-client] NEXT_PUBLIC_SOROBAN_CONTRACT_ID not set — skipping',
    )
    return
  }
  try {
    const server = new StellarSdk.rpc.Server(rpcUrl, { allowHttp: false })
    const contract = new StellarSdk.Contract(contractId)
    const account = await server.getAccount(record.sender)

    const tx = new StellarSdk.TransactionBuilder(
      account as unknown as StellarSdk.Account,
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      },
    )
      .addOperation(
        contract.call(
          'record_contribution',
          StellarSdk.Address.fromString(record.sender).toScVal(),
          StellarSdk.nativeToScVal(record.amount_stroops, { type: 'i128' }),
          StellarSdk.nativeToScVal(record.timestamp, { type: 'u64' }),
        ),
      )
      .setTimeout(30)
      .build()

    const simResult = await server.simulateTransaction(tx)
    if (!StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      throw new Error(`Simulation failed: ${JSON.stringify(simResult)}`)
    }

    const { signWithFreighter } = await import('./wallet')
    const assembled = StellarSdk.rpc.assembleTransaction(tx, simResult).build()
    const signedXDR = await signWithFreighter(
      assembled.toXDR(),
      StellarSdk.Networks.TESTNET,
    )
    const signed = StellarSdk.TransactionBuilder.fromXDR(
      signedXDR,
      StellarSdk.Networks.TESTNET,
    )
    await server.sendTransaction(signed as StellarSdk.Transaction)
  } catch (err) {
    console.error(
      '[soroban-client] recordContribution failed (fire-and-forget):',
      err,
    )
  }
}

/**
 * Record a payout on-chain via the IponPay Soroban contract.
 * Fire-and-forget — errors are caught and logged, never re-thrown.
 * Called by the payout API route after a successful Horizon payment.
 *
 * @param poolAddress   - The pool Stellar address (acts as caller/authorizer)
 * @param poolSecret    - The pool secret key (server-side only)
 * @param recipient     - The recipient's Stellar address
 * @param amountStroops - Payout amount in stroops (bigint)
 * @param cycleNumber   - Which cycle number this payout is for
 * @param timestamp     - Unix timestamp (bigint)
 */
export async function recordPayout(params: {
  poolAddress: string
  poolSecret: string
  recipient: string
  amountStroops: bigint
  cycleNumber: number
  timestamp: bigint
}): Promise<void> {
  const { poolAddress, poolSecret, recipient, amountStroops, cycleNumber, timestamp } = params
  const contractId = getContractId()
  if (!contractId) {
    console.warn('[soroban-client] NEXT_PUBLIC_SOROBAN_CONTRACT_ID not set — skipping payout record')
    return
  }
  try {
    const rpcServer = new StellarSdk.rpc.Server(rpcUrl, { allowHttp: false })
    const contract = new StellarSdk.Contract(contractId)

    const account = await rpcServer.getAccount(poolAddress)

    const tx = new StellarSdk.TransactionBuilder(
      account as unknown as StellarSdk.Account,
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      },
    )
      .addOperation(
        contract.call(
          'record_payout',
          StellarSdk.Address.fromString(poolAddress).toScVal(),
          StellarSdk.Address.fromString(recipient).toScVal(),
          StellarSdk.nativeToScVal(amountStroops, { type: 'i128' }),
          StellarSdk.nativeToScVal(cycleNumber, { type: 'u32' }),
          StellarSdk.nativeToScVal(timestamp, { type: 'u64' }),
        ),
      )
      .setTimeout(30)
      .build()

    const simResult = await rpcServer.simulateTransaction(tx)
    if (!StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      throw new Error(`Simulation failed: ${JSON.stringify(simResult)}`)
    }

    const assembled = StellarSdk.rpc.assembleTransaction(tx, simResult).build()

    // Sign with the pool keypair (server-side — secret never leaves the server)
    const keypair = StellarSdk.Keypair.fromSecret(poolSecret)
    assembled.sign(keypair)

    await rpcServer.sendTransaction(assembled as StellarSdk.Transaction)
  } catch (err) {
    console.error('[soroban-client] recordPayout failed (fire-and-forget):', err)
  }
}
