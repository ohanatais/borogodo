'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Paperclip, User } from 'lucide-react'
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
import { Segmented } from '@/components/ui/Segmented'
import { LogoutButton } from '@/components/features/auth/LogoutButton'
import { NAV_DESTINOS, isActive } from './navModel'

const ARTIFACT_THRESHOLD_CHARS = 150

interface AppShellClientProps {
  userName: string
  children: React.ReactNode
}

export function AppShellClient({ userName, children }: AppShellClientProps) {
  const pathname = usePathname()
  const t = useTranslations('capture')
  const tNav = useTranslations()
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

  // A autoavaliação é a única superfície "pra dentro" (a pessoa ESCREVE). A barra de captura ("pra
  // fora") sobreporia o editor e brigaria de modo: escondida aqui. A nav mobile permanece.
  const hideCapture = pathname.includes('/autoavaliacao')

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

        {/* Nav */}
        <nav className="flex-1 py-4 px-3" aria-label="Navegação principal">
          {NAV_DESTINOS.map((item) => {
            const active = isActive(item, pathname)
            const Icon = item.icon
            const label = tNav(item.labelKey)
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
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors"
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
        {!hideCapture && (
        <div
          className="hidden lg:block sticky bottom-0"
          style={{
            background: 'linear-gradient(to top, var(--color-creme) 72%, transparent)',
          }}
        >
          <div className="max-w-[980px] mx-auto px-6 pt-4 pb-5">
            <div className="flex items-center gap-3">
              {/* Toggle — Segmented padrão (021) */}
              <div className="shrink-0">
                <Segmented
                  size="sm"
                  ariaLabel="Modo da barra"
                  items={[
                    { key: 'registrar', label: 'Registrar', active: !chatOpen, onClick: () => closeChatSheet() },
                    { key: 'perguntar', label: 'Perguntar', active: chatOpen, onClick: () => openChatSheet() },
                  ]}
                />
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
        )}

        {/* ── Mobile bottom bar ──────────────────────── */}
        <div
          className="lg:hidden sticky bottom-0 border-t"
          style={{
            background: 'oklch(98% 0.008 90 / 0.95)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          {!hideCapture && (<>
          {/* Row 0 — toggle Registrar | Perguntar (Segmented padrão, linha própria no mobile) */}
          <div className="px-3 pt-2 pb-1">
            <Segmented
              size="sm"
              ariaLabel="Modo da barra"
              items={[
                { key: 'registrar', label: 'Registrar', active: !chatOpen, onClick: () => closeChatSheet() },
                { key: 'perguntar', label: 'Perguntar', active: chatOpen, onClick: () => openChatSheet() },
              ]}
            />
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
          </>)}

          {/* Row 2 — nav icons com labels */}
          <nav
            className="flex items-center justify-around px-2 pb-2"
            aria-label="Navegação"
          >
            {NAV_DESTINOS.map((item) => {
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
