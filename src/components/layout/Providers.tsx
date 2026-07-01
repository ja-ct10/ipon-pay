'use client'

import { ThemeProvider } from 'next-themes'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { WalletProvider } from '@/contexts/WalletContext'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      storageKey="ipon-pay-theme"
    >
      <WalletProvider>
        <Navbar />
        <AnimatePresence mode="sync">
          {children}
        </AnimatePresence>
      </WalletProvider>
    </ThemeProvider>
  )
}
