'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Botão de alternância de tema claro/escuro (US6, 025-registro-deposito). Posicionado no rodapé
 * da sidebar desktop (perto do avatar) e no cabeçalho mobile. Não guarda estado de "montado"
 * próprio — `next-themes` já deixa `resolvedTheme` `undefined` no primeiro render do cliente (até
 * ler `localStorage`/preferência do sistema) e provoca o re-render sozinho quando resolve; usar
 * esse `undefined` como fallback evita o mismatch de hidratação sem `useEffect` + `setState`
 * local (regra `react-hooks/set-state-in-effect` do projeto).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations('appNav.theme')

  const isDark = resolvedTheme === 'dark'
  const label = isDark ? t('toggleToLight') : t('toggleToDark')

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
      style={{ color: 'var(--muted-foreground)' }}
    >
      {isDark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
    </button>
  )
}
