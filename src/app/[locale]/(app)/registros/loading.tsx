import { PageContainer } from '@/components/layout/PageContainer'

export default function RegistrosLoading() {
  return (
    <PageContainer className="pb-28 lg:pb-10">
      <div className="h-8 w-48 rounded-lg mb-6 animate-pulse" style={{ background: 'var(--muted)' }} />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ background: 'var(--muted)', opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </PageContainer>
  )
}
