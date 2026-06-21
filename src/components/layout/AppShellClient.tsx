'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Sparkles, GitCommitVertical, PenLine, Paperclip, LayoutList, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { CaptureInput } from '@/components/features/capture/CaptureInput'
import { FileButton } from '@/components/features/capture/FileButton'
import { AudioButton } from '@/components/features/capture/AudioButton'
import { CaptureConversation } from '@/components/features/capture/CaptureConversation'
import { ChatSheet, openChatSheet, closeChatSheet } from '@/components/features/chat/ChatSheet'
import { GenerateSheet } from '@/components/features/content/GenerateSheet'
import type { CaptureInput as CapturePayload } from '@/types/capture'
import { Logo } from '@/components/ui/Logo'
import { LogoutButton } from '@/components/features/auth/LogoutButton'

const ARTIFACT_THRESHOLD_CHARS = 150

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string | null
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'painel',     label: 'Painel',         icon: <Home size={20} />,              path: '/painel'     },
  { id: 'espelho',    label: 'Espelho',         icon: <Sparkles size={20} />,          path: '/espelho'    },
  { id: 'registros',  label: 'Registros',       icon: <LayoutList size={20} />,        path: '/registros'  },
  { id: 'historico',  label: 'Linha do Tempo',  icon: <GitCommitVertical size={20} />, path: '/historico'  },
  { id: 'presenca',   label: 'Repertório',      icon: <PenLine size={20} />,           path: '/presenca'   },
]

interface AppShellClientProps {
  userName: string
  children: React.ReactNode
}

export function AppShellClient({ userName, children }: AppShellClientProps) {
  const pathname = usePathname()
  const t = useTranslations('capture')
  const [activeCapture, setActiveCapture] = useState<CapturePayload | null>(null)
  const [projectContext, setProjectContext] = useState<{ name: string; company: string } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ name: string; company: string }>).detail
      setProjectContext(detail)
    }
    function chatStateHandler(e: Event) {
      const detail = (e as CustomEvent<{ open: boolean }>).detail
      setChatOpen(detail.open)
    }
    window.addEventListener('borogodo:capture-context', handler)
    window.addEventListener('borogodo:chat-state', chatStateHandler)
    return () => {
      window.removeEventListener('borogodo:capture-context', handler)
      window.removeEventListener('borogodo:chat-state', chatStateHandler)
    }
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
                {userName.trim() ? userName.charAt(0).toUpperCase() : <User size={16} aria-hidden="true" />}
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
                <button
                  type="button"
                  onClick={() => closeChatSheet()}
                  aria-pressed={!chatOpen}
                  className="text-xs px-3 py-1.5 rounded-full capitalize transition-all hover:opacity-80"
                  style={{
                    background: chatOpen ? 'transparent' : 'var(--color-primary)',
                    color: chatOpen ? 'var(--muted-foreground)' : 'var(--color-primary-fg)',
                  }}
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => openChatSheet()}
                  aria-pressed={chatOpen}
                  className="text-xs px-3 py-1.5 rounded-full capitalize transition-all hover:opacity-80"
                  style={{
                    background: chatOpen ? 'var(--color-primary)' : 'transparent',
                    color: chatOpen ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
                  }}
                >
                  Perguntar
                </button>
              </div>
              <div className="flex-1">
                <CaptureInput
                  placeholder={t('composer.artifactPlaceholder')}
                  mode="registrar"
                  projectContext={projectContext}
                  onClearProjectContext={() => setProjectContext(null)}
                  onCapture={(content) => {
                    if (content.length >= ARTIFACT_THRESHOLD_CHARS) {
                      setActiveCapture({ kind: 'text', content })
                    } else {
                      openChatSheet({ prefillMessage: content, mode: 'registro' })
                    }
                  }}
                />
              </div>
              <AudioButton
                onTranscript={(text) => setActiveCapture({ kind: 'text', content: text })}
              />
              <FileButton
                accept=".pdf"
                icon={Paperclip}
                ariaLabel="Carregar PDF ou CV"
                onFile={(file) => setActiveCapture({ kind: 'file', file })}
              />
            </div>
            <p className="text-[11px] px-1 mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
              {t('composer.privacyNotice')}
            </p>
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
          {/* Row 0 — toggle Registrar | Perguntar (linha própria no mobile) */}
          <div className="px-3 pt-2 pb-1">
            <div
              className="inline-flex items-center p-0.5 rounded-full"
              style={{ background: 'oklch(100% 0 0 / 0.8)' }}
            >
              <button
                type="button"
                onClick={() => closeChatSheet()}
                aria-pressed={!chatOpen}
                className="text-xs px-3 py-1 rounded-full transition-all hover:opacity-80"
                style={{
                  background: chatOpen ? 'transparent' : 'var(--color-primary)',
                  color: chatOpen ? 'var(--muted-foreground)' : 'var(--color-primary-fg)',
                }}
              >
                Registrar
              </button>
              <button
                type="button"
                onClick={() => openChatSheet()}
                aria-pressed={chatOpen}
                className="text-xs px-3 py-1 rounded-full transition-all hover:opacity-80"
                style={{
                  background: chatOpen ? 'var(--color-primary)' : 'transparent',
                  color: chatOpen ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
                }}
              >
                Perguntar
              </button>
            </div>
          </div>

          {/* Row 1 — captura: input + enviar + áudio + arquivo */}
          <div className="flex items-center gap-2 px-3 pb-1.5">
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <CaptureInput
                placeholder={t('composer.artifactPlaceholder')}
                mode="registrar"
                projectContext={projectContext}
                onClearProjectContext={() => setProjectContext(null)}
                onCapture={(content) => {
                  if (content.length >= ARTIFACT_THRESHOLD_CHARS) {
                    setActiveCapture({ kind: 'text', content })
                  } else {
                    openChatSheet({ prefillMessage: content, mode: 'registro' })
                  }
                }}
                trailing={
                  <>
                    <AudioButton
                      onTranscript={(text) => setActiveCapture({ kind: 'text', content: text })}
                    />
                    <FileButton
                      accept=".pdf"
                      icon={Paperclip}
                      ariaLabel="Carregar PDF ou CV"
                      onFile={(file) => setActiveCapture({ kind: 'file', file })}
                    />
                  </>
                }
              />
              <p className="text-[10px] px-1 hidden" style={{ color: 'var(--muted-foreground)' }}>
                {t('composer.privacyNotice')}
              </p>
            </div>
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
