'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangleIcon } from 'lucide-react'

function ConnectWalletPromptInner() {
  const searchParams = useSearchParams()

  if (searchParams.get('redirected') !== '1') {
    return null
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
    >
      <AlertTriangleIcon
        className="mt-0.5 size-4 shrink-0 text-amber-500"
        aria-hidden="true"
      />
      <p>Connect your Freighter wallet to access this page.</p>
    </div>
  )
}

export { ConnectWalletPromptInner }

export default function ConnectWalletPrompt() {
  return (
    <Suspense fallback={null}>
      <ConnectWalletPromptInner />
    </Suspense>
  )
}
