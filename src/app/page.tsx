'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  BarChart2Icon,
  LinkIcon,
  ArrowRightIcon,
  WalletIcon,
  SendIcon,
  LayoutDashboardIcon,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import ConnectWalletPrompt from '@/components/wallet/ConnectWalletPrompt'
import { LandingNavbar } from '@/components/layout/LandingNavbar'
import ShinyText from '@/components/reactbits/ShinyText'

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const staggerSlow = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
}

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: LinkIcon,
    title: 'Transparent Contributions',
    description:
      'Every payment is recorded on the Stellar blockchain — immutable, verifiable, and open to all group members. No black box, no hidden fees.',
  },
  {
    icon: BarChart2Icon,
    title: 'Real-time Tracking',
    description:
      'Watch the pool grow in real time. See who has contributed and who is next in the payout schedule.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Blockchain Verified',
    description:
      'Smart contracts on Soroban enforce the rules automatically. No middlemen, no disputes.',
  },
]

// ─── Steps data ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: 1,
    icon: WalletIcon,
    title: 'Connect your wallet',
    description: 'Install Freighter and connect your Stellar wallet in seconds.',
  },
  {
    number: 2,
    icon: SendIcon,
    title: 'Send your contribution',
    description: 'Submit your 10 XLM contribution directly to the smart contract.',
  },
  {
    number: 3,
    icon: LayoutDashboardIcon,
    title: "Track your group's progress",
    description: 'Follow the pool balance and your payout position in real time.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { state } = useWallet()

  return (
    <div className="relative flex flex-col min-h-dvh overflow-x-hidden">
      {/* ── Full-page gradient background — smooth, no cropping ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% 0%, oklch(0.25 0.09 175 / 0.6) 0%, transparent 60%),
            radial-gradient(ellipse 80% 40% at 30% 5%, oklch(0.20 0.06 220 / 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 80% 40% at 70% 5%, oklch(0.18 0.05 280 / 0.3) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── Landing Navbar ── */}
      <LandingNavbar />

      {/* ── Connect Wallet Prompt (only shown when ?redirected=1) ── */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pt-20">
        <ConnectWalletPrompt />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Section 1 — Hero
      ══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-20 text-center"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center gap-7 max-w-2xl"
        >
          {/* Powered by Stellar badge */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-4 py-2 text-xs text-muted-foreground"
          >
            <LinkIcon
              className="size-3.5 text-emerald-500 shrink-0"
              aria-hidden="true"
              strokeWidth={1.5}
            />
            <ShinyText
              text="Powered by Stellar blockchain + Soroban smart contracts"
              color="oklch(0.62 0.014 240)"
              shineColor="oklch(0.696 0.197 154.6)"
              speed={3}
              className="text-xs"
            />
          </motion.div>

          {/* Hero heading */}
          <motion.h1
            id="hero-heading"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-5xl font-bold tracking-[-0.04em] leading-tight sm:text-7xl text-foreground"
          >
            Save together,{' '}
            <span className="text-emerald-500">grow together.</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-xl text-muted-foreground font-light max-w-md text-balance"
          >
            The Paluwagan, reimagined on the blockchain. Transparent group savings powered by smart contracts.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <ConnectButton className="text-base px-7 py-2.5 h-auto rounded-full" hideProviders />

            {state.isConnected && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                Go to Dashboard
                <ArrowRightIcon className="size-4" aria-hidden="true" strokeWidth={1.5} />
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Section 2 — Features
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="relative py-28 px-4 overflow-hidden"
      >
        {/* Background accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 40% at 50% 0%, oklch(0.696 0.197 154.6 / 0.03) 0%, transparent 60%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeIn}
              transition={{ duration: 0.5 }}
              className="inline-block text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3"
            >
              Why Choose Us
            </motion.span>
            <motion.h2
              id="features-heading"
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Built for{' '}
              <span className="text-emerald-500">trust</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-4 text-base text-muted-foreground max-w-lg mx-auto"
            >
              Every feature is designed to make group savings transparent, secure, and effortless.
            </motion.p>
          </motion.div>

          <motion.ul
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-8 sm:grid-cols-3"
            role="list"
          >
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <motion.li
                key={title}
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                <div className="relative flex flex-col gap-5 rounded-3xl border border-white/7 bg-card/50 backdrop-blur-sm p-8 h-full transition-all duration-300 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 overflow-hidden">
                  {/* Background number watermark */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-2 -right-2 text-8xl font-black text-white/[0.02] select-none leading-none"
                  >
                    {index + 1}
                  </span>

                  {/* Icon with animated entrance */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-500 transition-all duration-300 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/25 group-hover:shadow-md group-hover:shadow-emerald-500/10"
                  >
                    <Icon className="size-5" strokeWidth={1.5} />
                  </motion.div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>

                  {/* Bottom gradient accent on hover */}
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-300 group-hover:via-emerald-500/30"
                  />
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Section 3 — How it works
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="relative py-28 px-4 overflow-hidden"
      >
        {/* Section background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 80%, oklch(0.696 0.197 154.6 / 0.04) 0%, transparent 60%)',
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-20"
          >
            <motion.span
              variants={fadeIn}
              transition={{ duration: 0.5 }}
              className="inline-block text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3"
            >
              Getting Started
            </motion.span>
            <motion.h2
              id="how-it-works-heading"
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Three steps to{' '}
              <span className="text-emerald-500">financial freedom</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-4 text-base text-muted-foreground max-w-lg mx-auto"
            >
              No signup, no email, no middlemen. Just connect your wallet and start saving with your group.
            </motion.p>
          </motion.div>

          {/* Steps — large numbered cards with glow */}
          <motion.ol
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="relative grid gap-8 sm:grid-cols-3"
            aria-label="Steps to get started"
          >
            {STEPS.map(({ number, icon: StepIcon, title, description }) => (
              <motion.li
                key={number}
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                <div className="relative flex flex-col items-center text-center rounded-3xl border border-white/7 bg-card/50 backdrop-blur-sm p-10 h-full transition-all duration-300 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5">
                  {/* Large step number watermark */}
                  <span
                    aria-hidden="true"
                    className="absolute top-4 right-6 text-6xl font-black text-white/[0.03] select-none"
                  >
                    0{number}
                  </span>

                  {/* Animated step circle */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: number * 0.15, ease: 'easeOut' }}
                    className="relative mb-6"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-20"
                      style={{ animationDuration: '3s' }}
                    />
                    <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-emerald-950 shadow-xl shadow-emerald-500/20">
                      {number}
                    </div>
                  </motion.div>

                  {/* Icon */}
                  <div
                    aria-hidden="true"
                    className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/7 text-emerald-400 mb-5 transition-colors group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20"
                  >
                    <StepIcon className="size-5" strokeWidth={1.5} />
                  </div>

                  {/* Text */}
                  <h3 className="text-lg font-semibold tracking-tight mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Connector — between cards on desktop */}
                {number < STEPS.length && (
                  <div
                    aria-hidden="true"
                    className="absolute top-1/2 -right-4 hidden sm:flex items-center -translate-y-1/2 z-10"
                  >
                    <div className="w-8 h-px bg-gradient-to-r from-emerald-500/40 to-emerald-500/10" />
                  </div>
                )}
              </motion.li>
            ))}
          </motion.ol>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Footer
      ══════════════════════════════════════════════════════════════ */}
      <footer className="relative border-t border-white/7 py-12 px-4 mt-auto">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15 ring-1 ring-emerald-500/30 overflow-hidden">
              <img
                src="/logo-mark.svg"
                alt=""
                aria-hidden="true"
                className="size-4 object-contain"
              />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Ipon<span className="text-emerald-400">Pay</span>
            </span>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation" className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} IponPay. Built on Stellar.
          </p>
        </div>
      </footer>
    </div>
  )
}
