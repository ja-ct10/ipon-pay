'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  LayoutDashboard,
  SendHorizonal,
  Clock,
  CalendarDays,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { truncateAddress, cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
}

const NAV_LINKS: NavLink[] = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/contribute', label: 'Contribute',  icon: SendHorizonal   },
  { href: '/history',    label: 'History',     icon: Clock           },
  { href: '/schedule',   label: 'Schedule',    icon: CalendarDays    },
]

export function Navbar() {
  const pathname = usePathname()
  const { state } = useWallet()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Hide entirely on the landing page
  if (pathname === '/') return null

  return (
    <>
      {/* ── Desktop: full-width sticky top bar ──────────────────────── */}
      <header className="sticky top-0 z-40 w-full">
        {/* Frosted backdrop — full width */}
        <div className="absolute inset-0 bg-[oklch(0.09_0.018_243/0.75)] backdrop-blur-xl" aria-hidden="true" />
        {/* Ultra-subtle bottom separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />

        <nav
          aria-label="Main navigation"
          className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"
        >
          {/* ── Brand ─────────────────────────────────────────────── */}
          <Link
            href="/"
            aria-label="IponPay home"
            className="group flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg"
          >
            {/* SVG logo mark */}
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 transition-all duration-200 group-hover:bg-emerald-500/25 group-hover:ring-emerald-500/50 overflow-hidden">
              <img
                src="/logo-mark.svg"
                alt=""
                aria-hidden="true"
                className="size-5 object-contain"
              />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Ipon<span className="text-emerald-400">Pay</span>
            </span>
          </Link>

          {/* ── Center: floating pill nav — desktop only ───────────── */}
          <div
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
            role="list"
          >
            {/* Pill container */}
            <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/4 p-1 backdrop-blur-sm">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    role="listitem"
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-1.5 rounded-full px-10 py-2.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                      isActive
                        ? 'text-emerald-950'
                        : 'text-foreground/50 hover:text-foreground/90',
                    )}
                  >
                    {/* Active filled pill background — animated */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-emerald-400"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        aria-hidden="true"
                      />
                    )}
                          <span className="relative z-10">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* ── Right: wallet + mobile trigger ────────────────────── */}
          <div className="flex items-center gap-2">
            {/* Wallet address pill — desktop */}
            {state.isConnected && state.address && (
              <span
                className="hidden sm:flex items-center gap-1.5 font-address text-xs tabular-nums rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-emerald-400 transition-colors hover:border-emerald-500/35 hover:bg-emerald-500/12"
                title={state.address}
                aria-label={`Connected: ${state.address}`}
              >
                {/* Live dot */}
                <span className="relative flex size-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                {truncateAddress(state.address)}
                <span className="ml-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-0 text-[10px] font-medium text-amber-400 leading-4">
                  Testnet
                </span>
              </span>
            )}

            {/* Mobile menu trigger */}
            <button
              className="md:hidden inline-flex size-8 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-foreground/70 transition-all hover:border-white/15 hover:bg-white/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="size-4" strokeWidth={2} aria-hidden="true" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile menu drawer (slide down) ────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden sticky top-16 z-30 border-b border-white/7 bg-[oklch(0.10_0.018_243/0.96)] backdrop-blur-xl"
          >
            {/* Wallet pill — mobile top */}
            {state.isConnected && state.address && (
              <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                <span className="relative flex size-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                <span
                  className="font-address text-xs tabular-nums text-emerald-400"
                  title={state.address}
                >
                  {truncateAddress(state.address)}
                </span>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-0 text-[10px] font-medium text-amber-400 leading-4">
                  Testnet
                </span>
              </div>
            )}

            {/* Nav links */}
            <nav aria-label="Mobile navigation" className="flex flex-col gap-0.5 px-3 py-3">
              {NAV_LINKS.map(({ href, label, icon: Icon }, i) => {
                const isActive = pathname === href
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.04 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20'
                          : 'text-foreground/55 hover:bg-white/5 hover:text-foreground/90',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-foreground/40',
                        )}
                      >
                        <Icon className="size-3.5" strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
                      </span>
                      {label}
                      {isActive && (
                        <span className="ml-auto size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Bottom padding */}
            <div className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
