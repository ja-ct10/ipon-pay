import * as StellarSdk from '@stellar/stellar-sdk'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ContribEvent {
  id: string
  sender: string
  amountStroops: bigint
  timestamp: bigint
}

export interface PayoutEvent {
  id: string
  recipient: string
  amountStroops: bigint
  cycleNumber: number
  timestamp: bigint
}

export interface EventState {
  poolCollected: number // XLM amount (not stroops)
  members: Array<{ address: string; hasPaid: boolean; paidAt: string | null }>
}

// ─── Module-level state ───────────────────────────────────────────────────────

let intervalId: ReturnType<typeof setInterval> | null = null
const seenIds = new Set<string>()

// ─── Pure reducer ─────────────────────────────────────────────────────────────

/**
 * Pure reducer for processing a single contract event idempotently.
 *
 * If the event ID is already in `seenIds`, the state is returned unchanged.
 * Otherwise the event is recorded in `seenIds` and the state is updated:
 *  - ContribEvent: increments `poolCollected` (stroops → XLM) and marks the
 *    matching member as paid.
 *  - PayoutEvent: state is returned unchanged (payout handling belongs in the
 *    `onPayout` callback, not in the reducer).
 */
export function processEvent(
  state: EventState,
  event: ContribEvent | PayoutEvent,
  seenIds: Set<string>,
): EventState {
  if (seenIds.has(event.id)) {
    return state
  }

  seenIds.add(event.id)

  // Distinguish contrib vs payout by the presence of `sender`
  if ('sender' in event) {
    const contrib = event as ContribEvent
    const xlmAmount = Number(contrib.amountStroops) / 10_000_000

    const updatedMembers = state.members.map((member) =>
      member.address === contrib.sender
        ? { ...member, hasPaid: true, paidAt: new Date().toISOString() }
        : member,
    )

    return {
      ...state,
      poolCollected: state.poolCollected + xlmAmount,
      members: updatedMembers,
    }
  }

  // PayoutEvent — state unchanged; handled via onPayout callback
  return state
}

// ─── Event stream ─────────────────────────────────────────────────────────────

const rpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org'

/**
 * Attempt to extract a strkey address from an xdr.ScVal.
 * Returns an empty string on failure so the caller can decide what to do.
 */
function scValToAddress(val: StellarSdk.xdr.ScVal): string {
  try {
    return StellarSdk.Address.fromScVal(val).toString()
  } catch {
    return ''
  }
}

/**
 * Attempt to read a signed 128-bit integer from an xdr.ScVal.
 */
function scValToI128(val: StellarSdk.xdr.ScVal): bigint {
  try {
    // scvI128 is represented as { hi: Int64, lo: Uint64 }
    const i128 = val.i128()
    const hi = BigInt(i128.hi().toString())
    const lo = BigInt(i128.lo().toString())
    return (hi << BigInt(64)) | lo
  } catch {
    return BigInt(0)
  }
}

/**
 * Attempt to read an unsigned 64-bit integer from an xdr.ScVal.
 */
function scValToU64(val: StellarSdk.xdr.ScVal): bigint {
  try {
    return BigInt(val.u64().toString())
  } catch {
    return BigInt(0)
  }
}

/**
 * Attempt to read an unsigned 32-bit integer from an xdr.ScVal.
 */
function scValToU32(val: StellarSdk.xdr.ScVal): number {
  try {
    return val.u32()
  } catch {
    return 0
  }
}

/**
 * Return the string value of a symbol ScVal, or '' on failure.
 */
function scValToSymbol(val: StellarSdk.xdr.ScVal): string {
  try {
    return val.sym().toString()
  } catch {
    return ''
  }
}

/**
 * Parse the `value` ScVal of a contrib event into its components.
 * The contract emits: value = (amount_stroops: i128, timestamp: u64) as a tuple (ScVec).
 */
function parseContribValue(value: StellarSdk.xdr.ScVal): {
  amountStroops: bigint
  timestamp: bigint
} {
  try {
    const vec = value.vec()
    if (!vec || vec.length < 2) {
      return { amountStroops: BigInt(0), timestamp: BigInt(0) }
    }
    return {
      amountStroops: scValToI128(vec[0]),
      timestamp: scValToU64(vec[1]),
    }
  } catch {
    return { amountStroops: BigInt(0), timestamp: BigInt(0) }
  }
}

/**
 * Parse the `value` ScVal of a payout event into its components.
 * The contract emits: value = (amount_stroops: i128, cycle_number: u32, timestamp: u64).
 */
function parsePayoutValue(value: StellarSdk.xdr.ScVal): {
  amountStroops: bigint
  cycleNumber: number
  timestamp: bigint
} {
  try {
    const vec = value.vec()
    if (!vec || vec.length < 3) {
      return { amountStroops: BigInt(0), cycleNumber: 0, timestamp: BigInt(0) }
    }
    return {
      amountStroops: scValToI128(vec[0]),
      cycleNumber: scValToU32(vec[1]),
      timestamp: scValToU64(vec[2]),
    }
  } catch {
    return { amountStroops: BigInt(0), cycleNumber: 0, timestamp: BigInt(0) }
  }
}

/**
 * Start polling the Soroban RPC every 15 seconds for contract events.
 *
 * Any existing interval is cleared first (safe to call repeatedly).
 * Each poll deduplicates via the module-level `seenIds` Set.
 * Errors are logged to `console.error` and retried on the next interval.
 *
 * @param contractId - The Soroban contract ID (C... strkey)
 * @param onContrib  - Called for each new contrib event
 * @param onPayout   - Called for each new payout event
 */
export function startEventStream(
  contractId: string,
  onContrib: (e: ContribEvent) => void,
  onPayout: (e: PayoutEvent) => void,
): void {
  // Clear any running stream first
  stopEventStream()

  const server = new StellarSdk.rpc.Server(rpcUrl, { allowHttp: false })

  /**
   * Perform a single poll. We fetch the latest ledger and use a small
   * look-back window (200 ledgers ≈ ~16 minutes at ~5s/ledger) so we never
   * miss events that arrived since the last poll, but also don't re-fetch
   * the entire chain on every tick.
   */
  async function poll(): Promise<void> {
    try {
      const latestLedger = await server.getLatestLedger()
      // Look back 200 ledgers (~16 min) on each poll to catch any events we
      // might have missed. The seenIds Set ensures no double-processing.
      const startLedger = Math.max(1, latestLedger.sequence - 200)

      const result = await server.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds: [contractId],
          },
        ],
        limit: 200,
      })

      for (const event of result.events) {
        // Deduplicate by RPC-assigned event ID
        if (seenIds.has(event.id)) {
          continue
        }
        seenIds.add(event.id)

        // event.topic is xdr.ScVal[] — first element is the event name symbol
        const topics = event.topic
        if (!topics || topics.length < 2) {
          continue
        }

        const eventName = scValToSymbol(topics[0])

        if (eventName === 'contrib') {
          // topics[1] = sender address, value = (amount_stroops, timestamp)
          const sender = scValToAddress(topics[1])
          const { amountStroops, timestamp } = parseContribValue(event.value)

          onContrib({
            id: event.id,
            sender,
            amountStroops,
            timestamp,
          })
        } else if (eventName === 'payout') {
          // topics[1] = recipient address, value = (amount_stroops, cycle_number, timestamp)
          const recipient = scValToAddress(topics[1])
          const { amountStroops, cycleNumber, timestamp } = parsePayoutValue(event.value)

          onPayout({
            id: event.id,
            recipient,
            amountStroops,
            cycleNumber,
            timestamp,
          })
        }
        // Unknown event types are silently ignored
      }
    } catch (err) {
      console.error('[contract-events]', err)
    }
  }

  // Fire immediately on start, then repeat every 15 seconds
  poll()
  intervalId = setInterval(poll, 15_000)
}

/**
 * Stop the active event polling interval.
 * Safe to call when no stream is running.
 */
export function stopEventStream(): void {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}
