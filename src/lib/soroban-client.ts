import * as StellarSdk from '@stellar/stellar-sdk'
import type { ContributionRecord } from './types'

const rpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org'
const contractId = process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? ''

export async function recordContribution(
  record: ContributionRecord,
): Promise<void> {
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
