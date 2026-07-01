import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require wallet connection
const PROTECTED_ROUTES = ['/dashboard', '/contribute', '/history', '/schedule']

// Next.js 16: named export `proxy` replaces the deprecated `middleware` export.
// See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  // Authentication state is stored in the `wallet_connected` cookie.
  // This cookie is set by WalletProvider (lib/wallet.ts) on successful Freighter connect
  // and cleared on disconnect.
  const walletCookie = request.cookies.get('wallet_connected')
  const isConnected = walletCookie?.value === '1'

  if (!isConnected) {
    const landingUrl = new URL('/', request.url)
    landingUrl.searchParams.set('redirected', '1')
    return NextResponse.redirect(landingUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api).*)',
  ],
}
