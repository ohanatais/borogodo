import { AppShellClient } from './AppShellClient'

interface AppShellProps {
  userName: string
  /** Vocabulário de contextos da pessoa (Story 2) — alimenta o `ContextPillPicker` do Drawer. */
  contextVocabulary?: string[]
  children: React.ReactNode
}

export function AppShell({ userName, contextVocabulary, children }: AppShellProps) {
  return (
    <AppShellClient userName={userName} contextVocabulary={contextVocabulary}>
      {children}
    </AppShellClient>
  )
}
