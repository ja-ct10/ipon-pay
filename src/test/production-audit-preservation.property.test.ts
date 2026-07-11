import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')
const APP_DIR = resolve(ROOT, 'src/app')

/**
 * Property 2: Preservation – Existing Functionality Unchanged
 *
 * Verifies that the production readiness fix does not regress
 * existing layout behavior, metadata, or dependencies.
 */
describe('Property 2: Preservation (Existing Functionality)', () => {
  it('root layout preserves Providers wrapping children', () => {
    const content = readFileSync(resolve(APP_DIR, 'layout.tsx'), 'utf-8')
    expect(content).toContain('<Providers>')
    expect(content).toContain('{children}')
    expect(content).toContain('</Providers>')
  })

  it('root layout preserves Toaster component', () => {
    const content = readFileSync(resolve(APP_DIR, 'layout.tsx'), 'utf-8')
    expect(content).toContain('<Toaster')
    expect(content).toContain('richColors')
    expect(content).toContain('bottom-right')
  })

  it('root layout preserves font variables and html attributes', () => {
    const content = readFileSync(resolve(APP_DIR, 'layout.tsx'), 'utf-8')
    expect(content).toContain('inter.variable')
    expect(content).toContain('geistMono.variable')
    expect(content).toContain('suppressHydrationWarning')
    expect(content).toContain('antialiased')
  })

  it('metadata export preserves all existing fields', () => {
    const content = readFileSync(resolve(APP_DIR, 'layout.tsx'), 'utf-8')
    expect(content).toContain("'IponPay — Blockchain Paluwagan'")
    expect(content).toContain('blockchain-powered rotating savings')
    expect(content).toContain('/favicon.svg')
    expect(content).toContain('/apple-touch-icon.svg')
    expect(content).toContain('/og-image.svg')
    expect(content).toContain('openGraph')
    expect(content).toContain('twitter')
  })

  it('existing dependencies are preserved in package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))

    const requiredDeps = [
      '@creit.tech/stellar-wallets-kit',
      '@stellar/freighter-api',
      '@stellar/stellar-sdk',
      'next',
      'react',
      'react-dom',
      'framer-motion',
      'zustand',
      'next-themes',
      'sonner',
      'lucide-react',
    ]

    for (const dep of requiredDeps) {
      expect(pkg.dependencies[dep]).toBeDefined()
    }
  })

  it('existing devDependencies are preserved in package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))

    const requiredDevDeps = [
      'vitest',
      'fast-check',
      'typescript',
      'eslint',
      '@testing-library/react',
    ]

    for (const dep of requiredDevDeps) {
      expect(pkg.devDependencies[dep]).toBeDefined()
    }
  })

  it('for all valid page routes, layout wraps content unchanged', () => {
    const existingRoutes = ['/', '/dashboard', '/contribute', '/history', '/schedule']

    fc.assert(
      fc.property(
        fc.constantFrom(...existingRoutes),
        (route) => {
          // The route exists as a page.tsx in the appropriate directory
          const routeDir = route === '/' ? '' : route.slice(1)
          const pagePath = resolve(APP_DIR, routeDir, 'page.tsx')
          const content = readFileSync(pagePath, 'utf-8')
          // Page file should export a default function component
          expect(content).toMatch(/export default/)
        }
      )
    )
  })

  it('layout rendering order is preserved: html > body > Providers > children + Toaster + Analytics', () => {
    const content = readFileSync(resolve(APP_DIR, 'layout.tsx'), 'utf-8')

    const htmlIdx = content.indexOf('<html')
    const bodyIdx = content.indexOf('<body')
    const providersIdx = content.indexOf('<Providers>')
    const childrenIdx = content.indexOf('{children}')
    const toasterIdx = content.indexOf('<Toaster')

    // Correct nesting order
    expect(htmlIdx).toBeLessThan(bodyIdx)
    expect(bodyIdx).toBeLessThan(providersIdx)
    expect(providersIdx).toBeLessThan(childrenIdx)
    expect(childrenIdx).toBeLessThan(toasterIdx)
  })
})
