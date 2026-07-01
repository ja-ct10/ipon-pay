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
import { cn } from '@/lib/utils'
import { useWallet } from '@/contexts/WalletContext'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import ConnectWalletPrompt from '@/components/wallet/ConnectWalletPrompt'

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
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
    large: true,
  },
  {
    icon: BarChart2Icon,
    title: 'Real-time Tracking',
    description:
      'Watch the pool grow in real time. See who has contributed and who is next in the payout schedule.',
    large: false,
  },
  {
    icon: ShieldCheckIcon,
    title: 'Blockchain Verified',
    description:
      'Smart contracts on Soroban enforce the rules automatically. No middlemen, no disputes.',
    large: false,
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
    <div className="flex flex-col min-h-dvh">
      {/* ── Connect Wallet Prompt (only shown when ?redirected=1) ── */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <ConnectWalletPrompt />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Section 1 — Hero
      ══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-20 text-center"
      >
        {/* Radial gradient overlay — single subtle glow at top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.696 0.197 154.6 / 0.08), transparent)',
          }}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center gap-7 max-w-2xl"
        >
          {/* Hero heading — large, tight, impactful */}
          <motion.h1
            id="hero-heading"
            variants={fadeUp}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-6xl font-bold tracking-[-0.04em] leading-none sm:text-8xl text-foreground"
          >
            <span className="text-emerald-500">IponPay</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-xl text-muted-foreground font-light max-w-md text-balance"
          >
            The Paluwagan, reimagined on the blockchain. Save together,
            transparently.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <ConnectButton className="text-base px-7 py-2.5 h-auto rounded-full" />

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

          {/* Trust badge — Powered by Stellar */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-4 py-2 text-xs text-muted-foreground"
          >
            <LinkIcon
              className="size-3.5 text-emerald-500 shrink-0"
              aria-hidden="true"
              strokeWidth={1.5}
            />
            <span>Powered by Stellar blockchain + Soroban smart contracts</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Section 2 — Features (asymmetric layout)
      ══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="features-heading"
        className="py-20 px-4 bg-background"
      >
        <div className="mx-auto max-w-5xl">
          <motion.h2
            id="features-heading"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-10 text-center text-3xl font-bold tracking-tight"
          >
            Why IponPay?
          </motion.h2>

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="flex flex-col gap-6"
            role="list"
          >
            {/* First card — full-width, horizontal layout with large icon */}
            {(() => {
              const { icon: Icon, title, description } = FEATURES[0]
              return (
                <motion.li
                  key={title}
                  variants={fadeUp}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  whileHover={{ scale: 1.02 }}
                  // @ts-expect-error framer-motion spring transition
                  whileHoverTransition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col gap-5 rounded-2xl border border-white/7 bg-card p-8 sm:flex-row sm:items-start sm:gap-8"
                >
                  <div
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500"
                  >
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                      {description}
                    </p>
                  </div>
                </motion.li>
              )
            })()}

            {/* Two smaller cards in a 2-column grid */}
            <li className="grid gap-6 sm:grid-cols-2" aria-label="Additional features">
              {FEATURES.slice(1).map(({ icon: Icon, title, description }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  whileHover={{ scale: 1.02 }}
                  // @ts-expect-error framer-motion spring transition
                  whileHoverTransition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col gap-3 rounded-2xl border border-white/7 bg-card p-6"
                >
                  <div
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500"
                  >
                    <Icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </motion.div>
              ))}
            </li>
          </motion.ul>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Section 3 — How it works (connected step indicator)
      ══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="how-it-works-heading"
        className="py-20 px-4 bg-background"
      >
        <div className="mx-auto max-w-2xl">
          <motion.h2
            id="how-it-works-heading"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-12 text-center text-3xl font-bold tracking-tight"
          >
            How it works
          </motion.h2>

          <motion.ol
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="relative flex flex-col"
            aria-label="Steps to get started"
          >
            {/* Vertical connector line */}
            <div
              aria-hidden="true"
              className="absolute left-4.5 top-10 bottom-10 w-px bg-emerald-500/20 sm:left-5.5"
            />

            {STEPS.map(({ number, icon: StepIcon, title, description }, index) => (
              <motion.li
                key={number}
                variants={fadeUp}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={cn(
                  'relative flex items-start gap-5',
                  index < STEPS.length - 1 && 'pb-8',
                )}
              >
                {/* Step circle */}
                <div
                  aria-hidden="true"
                  className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold tabular-nums text-emerald-950 shadow-sm shadow-emerald-500/30"
                >
                  <span>{number}</span>
                </div>

                {/* Step content */}
                <div className="flex flex-col gap-1 pt-1 pb-2">
                  <div className="flex items-center gap-2">
                    <StepIcon
                      className="size-4 text-emerald-400 shrink-0"
                      aria-hidden="true"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-sm font-semibold">{title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>
    </div>
  )
}
