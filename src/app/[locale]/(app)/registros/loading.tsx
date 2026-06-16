export default function RegistrosLoading() {
  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-9 py-8">
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
    </div>
  )
}
