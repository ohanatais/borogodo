import { AppShellClient } from './AppShellClient'

interface AppShellProps {
  userName: string
  children: React.ReactNode
}

export function AppShell({ userName, children }: AppShellProps) {
  return (
    <AppShellClient userName={userName}>
      {children}
    </AppShellClient>
  )
}
