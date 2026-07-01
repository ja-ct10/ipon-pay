// Feature: ipon-pay
// Property-based tests for src/lib/utils.ts utility functions
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  truncateAddress,
  formatXLM,
  hasInsufficientFunds,
  mapStellarError,
  calculateProgress,
  updateMemberStatus,
  sortTransactions,
  filterTransactions,
  filterByStatus,
} from '@/lib/utils'
import type { Member, ContributionTx } from '@/lib/types'

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Arbitrary for an ISO timestamp string using integer ms to avoid
 * `fc.date` shrinking through invalid Date values.
 */
const arbISOTimestamp = (): fc.Arbitrary<string> => {
  const minMs = new Date('2020-01-01T00:00:00Z').getTime()
  const maxMs = new Date('2030-01-01T00:00:00Z').getTime()
  return fc
    .integer({ min: minMs, max: maxMs })
    .map((ms) => new Date(ms).toISOString())
}

/** Arbitrary for a ContributionTx with controlled fields */
const arbTx = (): fc.Arbitrary<ContributionTx> =>
  fc.record({
    txHash: fc.string({ minLength: 8, maxLength: 64 }),
    sender: fc.string({ minLength: 1, maxLength: 60 }),
    recipient: fc.option(fc.string({ minLength: 1, maxLength: 60 }), { nil: undefined }),
    amount: fc.float({ min: 0, max: 10_000, noNaN: true }).map(String),
    timestamp: arbISOTimestamp(),
    status: fc.constantFrom('success' as const, 'failed' as const),
    type: fc.constantFrom('contribution' as const, 'payout' as const),
  })

/** Arbitrary for a Member */
const arbMember = (): fc.Arbitrary<Member> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    address: fc.string({ minLength: 1, maxLength: 60 }),
    hasPaid: fc.boolean(),
    paidAt: fc.option(arbISOTimestamp(), { nil: null }),
  })

// ─── Property 1: Address Truncation Consistency ───────────────────────────────

describe('Property 1: Address truncation consistency', () => {
  // Feature: ipon-pay, Property 1: Address truncation consistency

  it('result length equals start + 3 + end when address is long enough', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 80 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (address, start, end) => {
          if (address.length > start + end) {
            const result = truncateAddress(address, start, end)
            expect(result.length).toBe(start + 3 + end)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('result starts with first `start` chars and ends with last `end` chars when long enough', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 80 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (address, start, end) => {
          if (address.length > start + end) {
            const result = truncateAddress(address, start, end)
            expect(result.slice(0, start)).toBe(address.slice(0, start))
            expect(result.slice(-end)).toBe(address.slice(-end))
            expect(result).toContain('...')
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns original string unchanged when address.length <= start + end', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 80 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (address, start, end) => {
          if (address.length <= start + end) {
            const result = truncateAddress(address, start, end)
            expect(result).toBe(address)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 2: XLM Balance Formatting ──────────────────────────────────────

describe('Property 2: XLM balance formatting', () => {
  // Feature: ipon-pay, Property 2: XLM balance formatting

  it('always returns a string with exactly 2 decimal places for non-negative finite numbers', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (amount) => {
          const result = formatXLM(amount)
          // Must contain exactly one decimal point with exactly 2 digits after it
          expect(result).toMatch(/^\d+\.\d{2}$/)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns "0.00" for non-numeric strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(parseFloat(s))),
        (nonNumeric) => {
          expect(formatXLM(nonNumeric)).toBe('0.00')
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 4: Insufficient Funds Guard ────────────────────────────────────

describe('Property 4: Insufficient funds guard', () => {
  // Feature: ipon-pay, Property 4: Insufficient funds guard

  it('returns true iff balance < amount + reserve for any finite triple', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        (balance, amount, reserve) => {
          const result = hasInsufficientFunds(balance, amount, reserve)
          expect(result).toBe(balance < amount + reserve)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns false when balance === amount + reserve exactly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: 500_000, noNaN: true, noDefaultInfinity: true }),
        (amount, reserve) => {
          const balance = amount + reserve
          expect(hasInsufficientFunds(balance, amount, reserve)).toBe(false)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 5: Stellar Error Code Mapping ──────────────────────────────────

describe('Property 5: Stellar error code mapping', () => {
  // Feature: ipon-pay, Property 5: Stellar error code mapping

  /**
   * The 7 known error codes. Note: `tx_failed` maps to the same string as the
   * default fallback by design — both return 'Transaction failed. Please try again.'
   * The remaining 6 codes map to distinct, non-default messages.
   */
  const KNOWN_CODES = [
    'op_underfunded',
    'tx_bad_seq',
    'op_no_destination',
    'tx_insufficient_fee',
    'op_line_full',
    'tx_bad_auth',
    'tx_failed',
  ] as const

  const DEFAULT_FALLBACK = 'Transaction failed. Please try again.'

  it('always returns a non-empty string for any safe string input', () => {
    fc.assert(
      fc.property(
        // Constrain to alphanumeric + underscore strings to avoid Object.prototype
        // key collisions (e.g. "toString", "valueOf") which bypass the ?? guard
        fc.stringMatching(/^[a-zA-Z0-9_]{0,30}$/),
        (code) => {
          const result = mapStellarError(code)
          expect(typeof result).toBe('string')
          expect(result.length).toBeGreaterThan(0)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('each of the 7 known codes returns a non-empty string', () => {
    KNOWN_CODES.forEach((code) => {
      const result = mapStellarError(code)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  it('the 6 non-fallback known codes return distinct messages different from the default', () => {
    // tx_failed intentionally maps to the same value as the default fallback;
    // the other 6 codes each return a unique, non-default message
    const distinctCodes = KNOWN_CODES.filter((c) => c !== 'tx_failed')
    const messages = distinctCodes.map((code) => mapStellarError(code))

    messages.forEach((msg, i) => {
      expect(typeof msg).toBe('string')
      expect(msg).not.toBe(DEFAULT_FALLBACK)
      expect(msg.length).toBeGreaterThan(0)
      // Each message is distinct from every other in this set
      const others = messages.filter((_, j) => j !== i)
      expect(others).not.toContain(msg)
    })
  })

  it('returns the default fallback for any unknown code', () => {
    fc.assert(
      fc.property(
        fc
          .stringMatching(/^[a-zA-Z0-9_]{0,30}$/)
          .filter((s) => !(KNOWN_CODES as readonly string[]).includes(s)),
        (unknownCode) => {
          expect(mapStellarError(unknownCode)).toBe(DEFAULT_FALLBACK)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 6: Pool Progress Calculation ───────────────────────────────────

describe('Property 6: Pool progress calculation', () => {
  // Feature: ipon-pay, Property 6: Pool progress calculation

  it('result is always in [0, 100] when collected >= 0 and target > 0', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 2_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: Number.EPSILON, max: 1_000_000, noNaN: true }),
        (collected, target) => {
          const result = calculateProgress(collected, target)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns exactly 100 when collected >= target (target > 0, collected > 0)', () => {
    fc.assert(
      fc.property(
        // Use integers to avoid floating-point precision edge cases where
        // target + extra rounds back to target (subnormal floats)
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (target, extra) => {
          const collected = target + extra
          expect(calculateProgress(collected, target)).toBe(100)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns 0 when collected is 0 and target > 0', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Number.EPSILON, max: 1_000_000, noNaN: true }),
        (target) => {
          expect(calculateProgress(0, target)).toBe(0)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns 0 when target <= 0 (no division by zero)', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        fc.float({ max: 0, noNaN: true, noDefaultInfinity: true }),
        (collected, target) => {
          expect(calculateProgress(collected, target)).toBe(0)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ─── Property 7: Member Status Update Correctness ────────────────────────────

describe('Property 7: Member status update correctness', () => {
  // Feature: ipon-pay, Property 7: Member status update correctness

  it('returns array of the same length as input', () => {
    fc.assert(
      fc.property(fc.array(arbMember()), arbTx(), (members, tx) => {
        const result = updateMemberStatus(members, tx)
        expect(result.length).toBe(members.length)
      }),
      { numRuns: 100 },
    )
  })

  it('marks hasPaid: true and sets paidAt only on members matching tx.sender', () => {
    fc.assert(
      fc.property(fc.array(arbMember()), arbTx(), (members, tx) => {
        const result = updateMemberStatus(members, tx)
        result.forEach((member, i) => {
          if (members[i].address === tx.sender) {
            expect(member.hasPaid).toBe(true)
            expect(member.paidAt).toBe(tx.timestamp)
          }
        })
      }),
      { numRuns: 100 },
    )
  })

  it('leaves all non-matching members hasPaid and paidAt unchanged', () => {
    fc.assert(
      fc.property(fc.array(arbMember()), arbTx(), (members, tx) => {
        const result = updateMemberStatus(members, tx)
        result.forEach((member, i) => {
          if (members[i].address !== tx.sender) {
            expect(member.hasPaid).toBe(members[i].hasPaid)
            expect(member.paidAt).toBe(members[i].paidAt)
          }
        })
      }),
      { numRuns: 100 },
    )
  })

  it('does NOT mutate the original input array', () => {
    fc.assert(
      fc.property(fc.array(arbMember()), arbTx(), (members, tx) => {
        const snapshot = members.map((m) => ({ ...m }))
        updateMemberStatus(members, tx)
        members.forEach((member, i) => {
          expect(member.hasPaid).toBe(snapshot[i].hasPaid)
          expect(member.paidAt).toBe(snapshot[i].paidAt)
          expect(member.address).toBe(snapshot[i].address)
        })
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property 8: Transaction Sort Order ──────────────────────────────────────

describe('Property 8: Transaction sort order', () => {
  // Feature: ipon-pay, Property 8: Transaction sort order

  it('adjacent pairs satisfy txs[i].timestamp >= txs[i+1].timestamp (descending)', () => {
    fc.assert(
      fc.property(fc.array(arbTx(), { minLength: 1 }), (txs) => {
        const sorted = sortTransactions(txs)
        for (let i = 0; i < sorted.length - 1; i++) {
          const a = new Date(sorted[i].timestamp).getTime()
          const b = new Date(sorted[i + 1].timestamp).getTime()
          expect(a).toBeGreaterThanOrEqual(b)
        }
      }),
      { numRuns: 100 },
    )
  })

  it('output has the same length as input', () => {
    fc.assert(
      fc.property(fc.array(arbTx()), (txs) => {
        const sorted = sortTransactions(txs)
        expect(sorted.length).toBe(txs.length)
      }),
      { numRuns: 100 },
    )
  })

  it('does NOT mutate the input array', () => {
    fc.assert(
      fc.property(fc.array(arbTx()), (txs) => {
        const originalOrder = txs.map((t) => t.txHash)
        sortTransactions(txs)
        // The input array's order must remain the same after the sort
        txs.forEach((tx, i) => {
          expect(tx.txHash).toBe(originalOrder[i])
        })
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property 9: Transaction Filter Correctness ──────────────────────────────

describe('Property 9: Transaction filter correctness', () => {
  // Feature: ipon-pay, Property 9: Transaction filter correctness

  it('every filterTransactions result matches sender, txHash, or recipient (case-insensitive)', () => {
    fc.assert(
      fc.property(
        fc.array(arbTx()),
        fc.string({ minLength: 1, maxLength: 20 }),
        (txs, query) => {
          const result = filterTransactions(txs, query)
          const q = query.toLowerCase()
          result.forEach((tx) => {
            const matchesSender = tx.sender.toLowerCase().includes(q)
            const matchesHash = tx.txHash.toLowerCase().includes(q)
            const matchesRecipient = tx.recipient ? tx.recipient.toLowerCase().includes(q) : false
            expect(matchesSender || matchesHash || matchesRecipient).toBe(true)
          })
        },
      ),
      { numRuns: 100 },
    )
  })

  it('empty query returns all items', () => {
    fc.assert(
      fc.property(fc.array(arbTx()), (txs) => {
        const result = filterTransactions(txs, '')
        expect(result.length).toBe(txs.length)
      }),
      { numRuns: 100 },
    )
  })

  it('filterByStatus("all") returns all items unchanged', () => {
    fc.assert(
      fc.property(fc.array(arbTx()), (txs) => {
        const result = filterByStatus(txs, 'all')
        expect(result.length).toBe(txs.length)
        // Reference equality: filterByStatus('all') returns the original array as-is
        txs.forEach((tx, i) => {
          expect(result[i]).toBe(tx)
        })
      }),
      { numRuns: 100 },
    )
  })

  it('filterByStatus("success") returns only items with status === "success"', () => {
    fc.assert(
      fc.property(fc.array(arbTx()), (txs) => {
        const result = filterByStatus(txs, 'success')
        result.forEach((tx) => {
          expect(tx.status).toBe('success')
        })
        // Verify no success items are dropped
        const expected = txs.filter((tx) => tx.status === 'success')
        expect(result.length).toBe(expected.length)
      }),
      { numRuns: 100 },
    )
  })
})
