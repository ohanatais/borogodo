import { PageContainer } from '@/components/layout/PageContainer'

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
    <PageContainer>
      <div className="space-y-6">
        <div className="space-y-3 max-w-xl">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-7 w-full" />
          <SkeletonBlock className="h-7 w-2/3" />
        </div>
        <SkeletonBlock className="h-5 w-80" />
      </div>
    </PageContainer>
  )
}
