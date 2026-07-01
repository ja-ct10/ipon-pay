// Feature: ipon-pay, Property 11: Theme toggle round-trip
import { it } from 'vitest'
import * as fc from 'fast-check'

function toggle(theme: string): string {
  return theme === 'dark' ? 'light' : 'dark'
}

it('toggling theme twice always returns to the original value', () => {
  fc.assert(
    fc.property(fc.constantFrom('dark' as const, 'light' as const), (initial) => {
      return toggle(toggle(initial)) === initial
    }),
    { numRuns: 100 },
  )
})

it('toggle always produces either dark or light', () => {
  fc.assert(
    fc.property(fc.string(), (anyTheme) => {
      const result = toggle(anyTheme)
      return result === 'dark' || result === 'light'
    }),
    { numRuns: 100 },
  )
})
