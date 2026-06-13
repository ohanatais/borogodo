function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ background: 'var(--muted)' }}
      aria-hidden="true"
    />
  )
}

export default function PainelLoading() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--color-creme)' }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <SkeletonBlock className="h-7 w-32" />
        <SkeletonBlock className="h-9 w-24" />
      </header>

      <div className="flex-1 space-y-6 px-6 py-8">
        <div className="space-y-3 max-w-xl">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-7 w-full" />
          <SkeletonBlock className="h-7 w-2/3" />
        </div>
        <SkeletonBlock className="h-5 w-80" />
      </div>

      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <SkeletonBlock className="h-12 max-w-2xl mx-auto" />
      </div>
    </main>
  )
}
