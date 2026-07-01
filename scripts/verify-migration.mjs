// scripts/verify-migration.mjs
// Diagnostic tool: compares Horizon payment history against the new Soroban contract state.
// No writes — read-only verification only.
import * as StellarSdk from '@stellar/stellar-sdk'

const POOL_ADDRESS = 'GBQFOMWQPFJ5FTYXOASSVQOQ2W4XD7MXYGRFDZB7E52VXOW2ZQIGDQEH'
const CONTRACT_ID = 'CDB7SE7O5VMN7DQSKCHYG6TVXTDJWULYKXZTSZQVO4DGRGYRFIQSJ44P'
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const SOROBAN_URL = 'https://soroban-testnet.stellar.org'

async function main() {
  // 1. Fetch contributions from Horizon
  const server = new StellarSdk.Horizon.Server(HORIZON_URL)
  const payments = await server.payments().forAccount(POOL_ADDRESS).order('asc').limit(200).call()

  const horizonContributions = payments.records
    .filter(r => r.type === 'payment' && r.from !== POOL_ADDRESS)
    .map(r => ({
      sender: r.from,
      amount: r.amount,
      timestamp: r.created_at,
      txHash: r.transaction_hash,
    }))

  console.log(`\n=== Horizon contributions (${horizonContributions.length} total) ===`)
  horizonContributions.forEach((c, i) => {
    console.log(`${i + 1}. ${c.sender.slice(0, 6)}...${c.sender.slice(-4)} | ${c.amount} XLM | ${c.timestamp}`)
  })

  // 2. Try to read from new contract using simulateTransaction (view call)
  try {
    const rpc = new StellarSdk.rpc.Server(SOROBAN_URL)
    const contract = new StellarSdk.Contract(CONTRACT_ID)

    // Get a dummy account to build the view tx
    const account = await rpc.getAccount(POOL_ADDRESS).catch(() => null)
    if (account) {
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(contract.call('get_contributions'))
        .setTimeout(30)
        .build()

      const sim = await rpc.simulateTransaction(tx)
      if (StellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result) {
        const result = StellarSdk.scValToNative(sim.result.retval)
        console.log(`\n=== New contract contributions (${result?.length ?? 0} stored) ===`)
        if (result?.length > 0) {
          result.forEach((r, i) => console.log(`${i + 1}.`, r))
        } else {
          console.log('No contributions recorded yet in the new contract.')
        }
      } else {
        console.log('\nNew contract simulation returned no result or failed.')
        if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
          console.log('Simulation error:', JSON.stringify(sim, null, 2))
        }
      }
    } else {
      console.log('\nCould not fetch RPC account for pool address.')
    }
  } catch (err) {
    console.log('\nCould not read contract state:', err.message)
  }

  console.log('\n=== Summary ===')
  console.log('Horizon has the full truth — all payment transactions are permanent on-chain.')
  console.log('The new contract will accumulate new records going forward.')
  console.log('Old contract history remains at: CAGLGQA5E757DS4GU4JD5PRXS5GAOBRK3TTLXIXF7NA2BT7F3ME4DF5U')
  console.log('New contract:                    CDB7SE7O5VMN7DQSKCHYG6TVXTDJWULYKXZTSZQVO4DGRGYRFIQSJ44P')
}

main().catch(console.error)
