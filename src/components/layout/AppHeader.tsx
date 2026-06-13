import { Logo } from '@/components/ui/Logo'
import { LogoutButton } from '@/components/features/auth/LogoutButton'

interface AppHeaderProps {
  greeting: string
}

export function AppHeader({ greeting }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <Logo variant="light" size="sm" />

      <div className="flex items-center gap-4">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {greeting}
        </p>
        <LogoutButton />
      </div>
    </header>
  )
}
