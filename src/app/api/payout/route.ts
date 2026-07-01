import * as StellarSdk from '@stellar/stellar-sdk'

const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recipientAddress, amount } = body

    if (!recipientAddress || !amount) {
      return Response.json(
        { error: 'Missing recipientAddress or amount' },
        { status: 400 },
      )
    }

    // Validate recipient is a valid Stellar public key (G + 55 base32 chars)
    if (!/^G[A-Z2-7]{55}$/.test(recipientAddress)) {
      return Response.json({ error: 'Invalid recipient address' }, { status: 400 })
    }

    const poolSecret = process.env.POOL_SECRET_KEY
    const poolAddress = process.env.NEXT_PUBLIC_POOL_ADDRESS

    if (!poolSecret || !poolAddress) {
      return Response.json(
        { error: 'Pool not configured on server' },
        { status: 500 },
      )
    }

    const keypair = StellarSdk.Keypair.fromSecret(poolSecret)
    const server = new StellarSdk.Horizon.Server(HORIZON_URL)

    // Load the pool account to get the current sequence number
    const account = await server.loadAccount(poolAddress)

    // Build payment: pool → recipient
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: recipientAddress,
          asset: StellarSdk.Asset.native(),
          amount: amount, // e.g. "20.0000000"
        }),
      )
      .setTimeout(180)
      .build()

    // Sign with pool keypair (server-side — secret never leaves the server)
    tx.sign(keypair)

    // Submit to Horizon testnet
    const result = await server.submitTransaction(tx)

    return Response.json({ txHash: result.hash })
  } catch (err: unknown) {
    console.error('[payout] error:', err)
    const message = err instanceof Error ? err.message : 'Payout failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
