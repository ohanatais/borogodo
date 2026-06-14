import { AppShellClient } from './AppShellClient'

interface AppShellProps {
  userName: string
  captureHint: string
  children: React.ReactNode
}

export function AppShell({ userName, captureHint, children }: AppShellProps) {
  return (
    <AppShellClient userName={userName} captureHint={captureHint}>
      {children}
    </AppShellClient>
  )
}
