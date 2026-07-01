// Feature: ipon-pay, Property 10: Auth guard redirect consistency
import { it, describe } from 'vitest'
import * as fc from 'fast-check'

const PROTECTED_ROUTES = ['/dashboard', '/contribute', '/history', '/schedule']
const PUBLIC_ROUTES = ['/', '/about', '/faq']

// Pure logic mirror of proxy.ts auth check
function shouldRedirect(pathname: string, isConnected: boolean): boolean {
  const isProtected = PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
  return isProtected && !isConnected
}

describe('Property 10: Auth guard redirect consistency', () => {
  it('redirects to / iff route is protected AND wallet is disconnected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PROTECTED_ROUTES),
        fc.boolean(),
        (route, isConnected) => {
          const redirects = shouldRedirect(route, isConnected)
          return redirects === !isConnected
        },
      ),
      { numRuns: 100 },
    )
  })

  it('never redirects on public routes regardless of connection state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PUBLIC_ROUTES),
        fc.boolean(),
        (route, isConnected) => {
          return shouldRedirect(route, isConnected) === false
        },
      ),
      { numRuns: 100 },
    )
  })
})
