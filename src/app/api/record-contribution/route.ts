import * as StellarSdk from '@stellar/stellar-sdk'

const SOROBAN_URL = 'https://soroban-testnet.stellar.org'
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET

/**
 * Server-side Soroban contribution recording.
 * The pool keypair signs the invocation as fee-payer.
 * record_contribution no longer requires sender.require_auth() —
 * the Horizon payment already proves the sender made the contribution.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sender, amountStroops, timestamp } = body

    if (!sender || !amountStroops || !timestamp) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!/^G[A-Z2-7]{55}$/.test(sender)) {
      return Response.json({ error: 'Invalid sender address' }, { status: 400 })
    }

    const poolSecret = process.env.POOL_SECRET_KEY
    const poolAddress = process.env.NEXT_PUBLIC_POOL_ADDRESS
    const contractId = process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID

    if (!poolSecret || !poolAddress || !contractId) {
      return Response.json({ error: 'Server not configured' }, { status: 500 })
    }

    const keypair = StellarSdk.Keypair.fromSecret(poolSecret)
    const rpc = new StellarSdk.rpc.Server(SOROBAN_URL)
    const contract = new StellarSdk.Contract(contractId)

    // Use pool account as fee-payer (no sender auth required in the contract)
    const account = await rpc.getAccount(poolAddress)

    const tx = new StellarSdk.TransactionBuilder(
      account as unknown as StellarSdk.Account,
      { fee: StellarSdk.BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE },
    )
      .addOperation(
        contract.call(
          'record_contribution',
          StellarSdk.Address.fromString(sender).toScVal(),
          StellarSdk.nativeToScVal(BigInt(amountStroops), { type: 'i128' }),
          StellarSdk.nativeToScVal(BigInt(timestamp), { type: 'u64' }),
        ),
      )
      .setTimeout(30)
      .build()

    const simResult = await rpc.simulateTransaction(tx)
    if (!StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      console.error('[record-contribution] simulation failed:', JSON.stringify(simResult))
      return Response.json({ error: 'Simulation failed' }, { status: 500 })
    }

    const assembled = StellarSdk.rpc.assembleTransaction(tx, simResult).build()
    assembled.sign(keypair)

    await rpc.sendTransaction(assembled as StellarSdk.Transaction)

    return Response.json({ success: true })
  } catch (err: unknown) {
    console.error('[record-contribution] error:', err)
    const message = err instanceof Error ? err.message : 'Failed to record contribution'
    return Response.json({ error: message }, { status: 500 })
  }
}
