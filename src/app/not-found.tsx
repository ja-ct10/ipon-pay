import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
          <span className="text-3xl font-bold text-emerald-500" aria-hidden="true">
            404
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
