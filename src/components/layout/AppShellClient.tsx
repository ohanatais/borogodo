'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Sparkles, GitCommitVertical, Paperclip } from 'lucide-react'
import { useState, useEffect } from 'react'
import { CaptureInput } from '@/components/features/capture/CaptureInput'
import { FileButton } from '@/components/features/capture/FileButton'
import { CaptureConversation } from '@/components/features/capture/CaptureConversation'
import { ChatSheet, openChatSheet } from '@/components/features/chat/ChatSheet'
import { GenerateSheet } from '@/components/features/content/GenerateSheet'
import type { CaptureInput as CapturePayload } from '@/types/capture'
import { Logo } from '@/components/ui/Logo'
import { LogoutButton } from '@/components/features/auth/LogoutButton'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string | null
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'painel',    label: 'Painel',        icon: <Home size={20} />,              path: '/painel'    },
  { id: 'espelho',   label: 'Espelho',        icon: <Sparkles size={20} />,          path: '/espelho'   },
  { id: 'historico', label: 'Linha do Tempo', icon: <GitCommitVertical size={20} />, path: '/historico' },
]

interface AppShellClientProps {
  userName: string
  captureHint: string
  children: React.ReactNode
}

export function AppShellClient({ userName, captureHint, children }: AppShellClientProps) {
  const pathname = usePathname()
  const [activeCapture, setActiveCapture] = useState<CapturePayload | null>(null)
  const [projectContext, setProjectContext] = useState<{ name: string; company: string } | null>(null)

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ name: string; company: string }>).detail
      setProjectContext(detail)
    }
    window.addEventListener('borogodo:capture-context', handler)
    return () => window.removeEventListener('borogodo:capture-context', handler)
  }, [])

  function isActive(path: string | null): boolean {
    if (!path) return false
    return pathname.includes(path)
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-creme)' }}>
      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r"
        style={{ width: '248px', background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center px-6 border-b" style={{ height: '68px', borderColor: 'var(--border)' }}>
          <Link href="/painel" aria-label="Ir para o painel">
            <Logo variant="light" size="sm" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path)
            return (
              <div key={item.id} className="relative mb-1">
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    aria-hidden="true"
                  />
                )}
                {item.disabled || !item.path ? (
                  <span
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm cursor-not-allowed opacity-40"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors"
                    style={{
                      background: active ? 'var(--color-lilas-nevoa)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--muted-foreground)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </div>
            )
          })}
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
                {userName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {userName}
              </p>
            </Link>
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
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {userName.charAt(0).toUpperCase()}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── Desktop: capture footer sticky ─────────── */}
        <div
          className="hidden lg:block sticky bottom-0"
          style={{
            background: 'linear-gradient(to top, var(--color-creme) 72%, transparent)',
          }}
        >
          <div className="max-w-[980px] mx-auto px-6 pt-4 pb-5">
            <div className="flex items-center gap-3">
              {/* Toggle */}
              <div
                className="flex items-center p-0.5 rounded-full shrink-0"
                style={{ background: 'oklch(100% 0 0 / 0.7)' }}
              >
                <span
                  className="text-xs px-3 py-1.5 rounded-full capitalize"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  Registrar
                </span>
                <button
                  type="button"
                  onClick={() => openChatSheet()}
                  className="text-xs px-3 py-1.5 rounded-full capitalize transition-all hover:opacity-80"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Perguntar
                </button>
              </div>
              <CaptureInput
                placeholder={captureHint}
                mode="registrar"
                projectContext={projectContext}
                onClearProjectContext={() => setProjectContext(null)}
                onCapture={(content) => openChatSheet({ prefillMessage: content, mode: 'registro' })}
              />
              <FileButton
                accept=".pdf"
                icon={Paperclip}
                ariaLabel="Carregar PDF ou CV"
                onFile={(file) => setActiveCapture({ kind: 'file', file })}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile bottom bar ──────────────────────── */}
        <div
          className="lg:hidden sticky bottom-0 border-t"
          style={{
            background: 'oklch(98% 0.008 90 / 0.95)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Row 1 — captura: toggle + input + enviar */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
            <div
              className="flex items-center p-0.5 rounded-full shrink-0"
              style={{ background: 'oklch(100% 0 0 / 0.8)' }}
            >
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                Registrar
              </span>
              <button
                type="button"
                onClick={() => openChatSheet()}
                className="text-xs px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Perguntar
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <CaptureInput
                placeholder={captureHint}
                mode="registrar"
                projectContext={projectContext}
                onClearProjectContext={() => setProjectContext(null)}
                onCapture={(content) => openChatSheet({ prefillMessage: content, mode: 'registro' })}
              />
            </div>
            <FileButton
              accept=".pdf"
              icon={Paperclip}
              ariaLabel="Carregar PDF ou CV"
              onFile={(file) => setActiveCapture({ kind: 'file', file })}
            />
          </div>

          {/* Row 2 — nav icons com labels */}
          <nav
            className="flex items-center justify-around px-2 pb-2"
            aria-label="Navegação"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path)
              return !item.path ? (
                <span
                  key={item.id}
                  aria-label={item.label}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg opacity-30 cursor-not-allowed"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </span>
              ) : (
                <Link
                  key={item.id}
                  href={item.path}
                  aria-label={item.label}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors"
                  style={{ color: active ? 'var(--color-primary)' : 'var(--muted-foreground)' }}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {activeCapture && (
        <CaptureConversation
          input={activeCapture}
          onResolved={() => setActiveCapture(null)}
        />
      )}

      <ChatSheet />
      <GenerateSheet />
    </div>
  )
}
