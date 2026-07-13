'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Wrapper fino do `next-themes` (US6, 025-registro-deposito): toggla a classe `dark`/`light` em
 * `<html>` (`attribute="class"`, casando com o bloco `.dark` já existente em `globals.css`),
 * sincroniza com `prefers-color-scheme` do sistema e evita flash de tema errado no primeiro
 * paint. `src/app/layout.tsx` marca `<html suppressHydrationWarning>` porque a classe muda no
 * cliente antes da hidratação.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
