'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { User, PenLine } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/features/capture/Drawer'
import { ChatSheet, openChatSheet } from '@/components/features/chat/ChatSheet'
import { GenerateSheet } from '@/components/features/content/GenerateSheet'
import { OPEN_DRAWER_EVENT, type OpenDrawerDetail } from '@/components/features/painel/registroTriggerEvents'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoutButton } from '@/components/features/auth/LogoutButton'
import { NAV_DESTINOS, NAV_GROUPS, isActive, isGroupItemActive, type NavGroupItem, type NavDestino } from './navModel'

interface AppShellClientProps {
  userName: string
  children: React.ReactNode
}

export function AppShellClient({ userName, children }: AppShellClientProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tRegistro = useTranslations('registro')
  const tNav = useTranslations()
  // Drawer bottom sheet mobile (US7) — FAB central da tab bar. Também é o alvo do item
  // "Registrar" isolado no topo da sidebar desktop (US6) e do gatilho único do Painel (US5): abre
  // o mesmo Drawer, não navega.
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Conteúdo digitado/colado direto no gatilho do Painel antes do drawer abrir (FR-012a) — repassado
  // como `initialText` pro Drawer, que sincroniza no rascunho da sessão sem perder nada.
  const [drawerInitialText, setDrawerInitialText] = useState('')

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<OpenDrawerDetail>).detail
      setDrawerInitialText(detail?.initialText ?? '')
      setDrawerOpen(true)
    }
    window.addEventListener(OPEN_DRAWER_EVENT, handler)
    return () => {
      window.removeEventListener(OPEN_DRAWER_EVENT, handler)
    }
  }, [])

  function handleGroupItemAction(item: Extract<NavGroupItem, { kind: 'action' }>) {
    if (item.action === 'open-drawer') setDrawerOpen(true)
    if (item.action === 'open-chat') openChatSheet()
  }

  function renderMobileNavLink(item: NavDestino) {
    const active = isActive(item, pathname)
    const Icon = item.icon
    const label = tNav(item.labelKey)
    return (
      <Link
        key={item.id}
        href={item.path}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-12 min-h-12 justify-center"
        style={{ color: active ? 'var(--color-primary)' : 'var(--muted-foreground)' }}
      >
        <Icon size={20} />
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    )
  }

  return (
    // Frame de app com altura fixa: a janela não rola (sem rubber-band/barras brancas no topo e
    // rodapé). Só o <main> rola; menu e barras ficam fixos. h-dvh acompanha a barra do mobile.
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--color-creme)' }}>
      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col h-full shrink-0 border-r"
        style={{ width: '248px', background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center px-6 border-b" style={{ height: '68px', borderColor: 'var(--border)' }}>
          <Link href="/painel" aria-label="Ir para o painel">
            <Logo variant="light" size="sm" />
          </Link>
        </div>

        {/* Nav em grupos (US6): Painel/Registrar isolados no topo, depois "Meu espelho" e "Usar". */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="mb-4">
              {group.labelKey && (
                <p
                  className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {tNav(group.labelKey)}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const label = tNav(item.labelKey)

                if (item.kind === 'action') {
                  return (
                    <div key={item.id} className="relative mb-1">
                      <button
                        type="button"
                        onClick={() => handleGroupItemAction(item)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 min-h-12 rounded-lg text-sm transition-colors"
                        style={{ background: 'transparent', color: 'var(--muted-foreground)', fontWeight: 400 }}
                      >
                        <Icon size={20} />
                        {label}
                      </button>
                    </div>
                  )
                }

                const active = isGroupItemActive(item, pathname, searchParams)
                return (
                  <div key={item.id} className="relative mb-1">
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                        style={{ background: 'var(--color-primary)' }}
                        aria-hidden="true"
                      />
                    )}
                    <Link
                      href={item.path}
                      aria-current={active ? 'page' : undefined}
                      className="flex items-center gap-3 px-4 py-2.5 min-h-12 rounded-lg text-sm transition-colors"
                      style={{
                        background: active ? 'var(--color-lilas-nevoa)' : 'transparent',
                        color: active ? 'var(--color-primary)' : 'var(--muted-foreground)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <Icon size={20} />
                      {label}
                    </Link>
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Account footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <Link
              href="/configuracoes"
              className="flex items-center gap-3 min-w-0 flex-1"
              aria-label="Configurações"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                {userName.trim() ? userName.charAt(0).toUpperCase() : <User size={16} aria-hidden="true" />}
              </div>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {userName}
              </p>
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center justify-between px-5 border-b shrink-0"
          style={{ height: '60px', background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <Logo variant="light" size="sm" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/configuracoes"
              aria-label="Configurações"
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              {userName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── Mobile bottom bar ──────────────────────── */}
        <div
          className="lg:hidden sticky bottom-0 border-t relative"
          style={{
            // color-mix (não um literal fixo) pra a barra acompanhar --card no dark mode (US6,
            // 025) — antes ficava sempre creme-clara mesmo com o tema escuro ativo.
            background: 'color-mix(in oklch, var(--card) 95%, transparent)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          {/* FAB central (US7) — abre o Drawer como bottom sheet. Flutua acima da barra, sombra
              tingida de coral (padrão DESIGN.md). Único gatilho de registro no mobile — a barra
              de captura antiga (CaptureInput/FileButton + CaptureConversation) foi removida
              (025, Phase 10); AudioButton/AudioRecorder foram reaproveitados dentro do Drawer
              (FR-018), não na barra. */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={tRegistro('drawer.title')}
            className="absolute left-1/2 -translate-x-1/2 -top-[14px] w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-fg)',
              boxShadow: '0 6px 16px oklch(62% 0.22 28 / 0.30)',
            }}
          >
            <PenLine size={20} aria-hidden="true" />
          </button>

          {/* Row 2 — nav icons com labels. 4 destinos reais + o FAB flutuante no meio (US7) — sem
              um vão reservado pro FAB, os itens 2 e 3 ficam espremidos contra ele (5 "coisas"
              tentando ocupar o espaço de 4). Reserva um vão do tamanho do FAB entre os dois pares,
              como o protótipo já previa (`home-app.jsx` TabBar). */}
          <nav
            className="flex items-center justify-around px-2 pb-2"
            aria-label="Navegação"
          >
            {NAV_DESTINOS.slice(0, 2).map(renderMobileNavLink)}
            <span className="w-12 shrink-0" aria-hidden="true" />
            {NAV_DESTINOS.slice(2).map(renderMobileNavLink)}
          </nav>
        </div>
      </div>

      <ChatSheet />
      <GenerateSheet />
      {/* Sempre montado (como ChatSheet/GenerateSheet) — o rascunho da sessão (useDrawerDraft)
          sobrevive a fechar sem salvar (US7, FR-015): só é descartado ao salvar com sucesso ou
          ao navegar/recarregar a página. */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} initialText={drawerInitialText} />
    </div>
  )
}
