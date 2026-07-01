import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'IponPay — Blockchain Paluwagan',
  description:
    'A blockchain-powered rotating savings platform built on the Stellar network.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'IponPay — Blockchain Paluwagan',
    description: 'A blockchain-powered rotating savings platform built on the Stellar network.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IponPay — Blockchain Paluwagan',
    description: 'A blockchain-powered rotating savings platform built on the Stellar network.',
    images: ['/og-image.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <Toaster richColors duration={5000} position="bottom-right" />
      </body>
    </html>
  )
}
