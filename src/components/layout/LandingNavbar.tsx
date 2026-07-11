'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { ConnectButton } from '@/components/wallet/ConnectButton'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
]

export function LandingNavbar() {
  const { state } = useWallet()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track which section is currently in view
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((link) => link.href.replace('#', ''))

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`)
          } else if (activeSection === `#${entry.target.id}`) {
            // Only clear if scrolling back up past the section
            const rect = entry.target.getBoundingClientRect()
            if (rect.top > 0) {
              setActiveSection(null)
            }
          }
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: 0 }
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [activeSection])

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setActiveSection(href)
    const id = href.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        aria-label="Landing navigation"
        animate={{
          maxWidth: scrolled ? '36rem' : '64rem',
          borderRadius: scrolled ? '9999px' : '0px',
          backgroundColor: scrolled
            ? 'oklch(0.10 0.018 243 / 0.85)'
            : 'oklch(0.10 0.018 243 / 0)',
          borderColor: scrolled
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0)',
          backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
          boxShadow: scrolled
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
            : '0 0 0 0 rgba(0, 0, 0, 0)',
          paddingTop: scrolled ? '0.5rem' : '0.75rem',
          paddingBottom: scrolled ? '0.5rem' : '0.75rem',
          paddingLeft: scrolled ? '1.25rem' : '1.5rem',
          paddingRight: scrolled ? '1.25rem' : '1.5rem',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex w-full items-center justify-between border"
        style={{ borderStyle: 'solid' }}
      >
        {/* ── Left: Logo + Nav Links ─────────────────────────── */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="IponPay home"
            className="group flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg"
          >
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

          {/* Desktop nav links with active indicator */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = activeSection === href
              return (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => handleAnchorClick(e, href)}
                  className={`relative px-3 py-1.5 text-sm transition-colors rounded-full ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {/* Animated active pill indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="landing-nav-active"
                      className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </a>
              )
            })}
          </div>
        </div>

        {/* ── Right: CTA button only ─────────────────────────── */}
        <div className="hidden md:flex items-center">
          {state.isConnected ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium rounded-full bg-emerald-500 text-emerald-950 px-5 py-2 hover:bg-emerald-400 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <ConnectButton className="text-sm px-5 py-2 h-auto rounded-full" hideProviders />
          )}
        </div>

        {/* ── Mobile menu trigger ────────────────────────────── */}
        <button
          className="md:hidden inline-flex size-8 items-center justify-center rounded-full border border-white/8 bg-white/4 text-foreground/70 transition-all hover:border-white/15 hover:bg-white/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
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
      </motion.nav>

      {/* ── Mobile dropdown ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-landing-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-4 right-4 mt-2 rounded-2xl border border-white/10 bg-[oklch(0.10_0.018_243/0.95)] backdrop-blur-xl p-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = activeSection === href
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={(e) => handleAnchorClick(e, href)}
                    className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
                      isActive
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                        : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </a>
                )
              })}
              <div className="border-t border-white/7 mt-2 pt-3">
                <ConnectButton className="w-full text-sm px-5 py-2.5 h-auto rounded-full" hideProviders />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
