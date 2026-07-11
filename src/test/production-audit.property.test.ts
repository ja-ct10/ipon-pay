import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')
const APP_DIR = resolve(ROOT, 'src/app')

/**
 * Property 1: Bug Condition – Production Readiness Gaps
 *
 * For all combinations of production readiness requirements,
 * the fixed app MUST have all gaps resolved.
 */
describe('Property 1: Production Readiness (Bug Condition)', () => {
  it('error.tsx exists and is a client component with reset prop', () => {
    const filePath = resolve(APP_DIR, 'error.tsx')
    expect(existsSync(filePath)).toBe(true)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain("'use client'")
    expect(content).toContain('reset')
    expect(content).toContain('error')
  })

  it('not-found.tsx exists and has navigation link', () => {
    const filePath = resolve(APP_DIR, 'not-found.tsx')
    expect(existsSync(filePath)).toBe(true)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('not found')
    expect(content).toMatch(/href=["']\//)
  })

  it('global-error.tsx exists with own html/body tags', () => {
    const filePath = resolve(APP_DIR, 'global-error.tsx')
    expect(existsSync(filePath)).toBe(true)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain("'use client'")
    expect(content).toContain('<html')
    expect(content).toContain('<body')
    expect(content).toContain('reset')
  })

  it('@vercel/analytics is in package.json dependencies', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.dependencies['@vercel/analytics']).toBeDefined()
  })

  it('@vercel/speed-insights is in package.json dependencies', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.dependencies['@vercel/speed-insights']).toBeDefined()
  })

  it('layout.tsx exports viewport with correct properties', () => {
    const filePath = resolve(APP_DIR, 'layout.tsx')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('export const viewport')
    expect(content).toContain("'device-width'")
    expect(content).toContain('initialScale')
  })

  it('layout.tsx renders Analytics and SpeedInsights components', () => {
    const filePath = resolve(APP_DIR, 'layout.tsx')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('<Analytics')
    expect(content).toContain('<SpeedInsights')
    expect(content).toContain("@vercel/analytics/react")
    expect(content).toContain("@vercel/speed-insights/react")
  })

  it('for all bug condition states, the fix satisfies expected behavior', () => {
    const appState = {
      hasAnalytics: existsSync(resolve(APP_DIR, 'layout.tsx')) &&
        readFileSync(resolve(APP_DIR, 'layout.tsx'), 'utf-8').includes('<Analytics'),
      hasErrorBoundary: existsSync(resolve(APP_DIR, 'error.tsx')),
      hasNotFound: existsSync(resolve(APP_DIR, 'not-found.tsx')),
      hasGlobalError: existsSync(resolve(APP_DIR, 'global-error.tsx')),
      hasViewport: existsSync(resolve(APP_DIR, 'layout.tsx')) &&
        readFileSync(resolve(APP_DIR, 'layout.tsx'), 'utf-8').includes('export const viewport'),
    }

    fc.assert(
      fc.property(
        fc.record({
          hasAnalytics: fc.boolean(),
          hasErrorBoundary: fc.boolean(),
          hasNotFound: fc.boolean(),
          hasGlobalError: fc.boolean(),
          hasViewport: fc.boolean(),
        }),
        (input) => {
          const isBugCondition =
            !input.hasAnalytics ||
            !input.hasErrorBoundary ||
            !input.hasNotFound ||
            !input.hasGlobalError ||
            !input.hasViewport

          if (isBugCondition) {
            // The fixed app must satisfy ALL requirements
            expect(appState.hasAnalytics).toBe(true)
            expect(appState.hasErrorBoundary).toBe(true)
            expect(appState.hasNotFound).toBe(true)
            expect(appState.hasGlobalError).toBe(true)
            expect(appState.hasViewport).toBe(true)
          }
        }
      )
    )
  })
})
