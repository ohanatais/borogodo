'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { Trash2, Pencil, ChevronDown, ChevronUp, Paperclip, Sparkles } from 'lucide-react'
import type { FeedHighlight, FeedItem } from '@/lib/feed/types'
import { UsarButton } from '@/components/features/content/UsarButton'
import { AttachTile } from '@/components/features/capture/AttachTile'
import { HighlightCard } from './HighlightCard'
import { deriveContextStatus } from '@/lib/entries/contextStatus'
import { deriveOrganizationStatus } from '@/lib/entries/organizationStatus'
import { dispatchOpenDrawer } from '@/components/features/painel/registroTriggerEvents'

interface SourceCardProps {
  item: FeedItem
  variant: 'feed' | 'panel'
  onDelete?: (id: string) => void
  /** Notifica o pai da nova seleção de contexto, após o "Organizar" confirmar sucesso (a IA pode
   * resolver empresa/projeto pessoal quando ainda vazios, FR-002/FR-006). */
  onContextChange?: (id: string, next: { company: string | null; isPersonalProject: boolean }) => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type OrganizeButtonState = 'idle' | 'organizing' | 'done'

interface OrganizeResponseBody {
  status?: string
  highlights?: FeedHighlight[]
  company?: string | null
  is_personal_project?: boolean
}

/**
 * Card de uma FONTE no feed de Registros (US7, feature 026) — 1 card por fonte, nunca por
 * destaque (FR-025). Consolida o que antes vivia espalhado como `EntryCard`: os destaques agora
 * chegam prontos em `item.highlights` (join feito em `getFeedData`, ver `contracts/feed.md`) —
 * não há mais fetch lazy por card ao expandir.
 */
export function SourceCard({ item, variant, onDelete, onContextChange }: SourceCardProps) {
  const t = useTranslations('feed')
  const tRegistro = useTranslations('registro')
  const [expanded, setExpanded] = useState(false)
  // Story 2 (FR-008): sinalização discreta de "contexto não identificado" no header do card —
  // nunca um badge de erro/alerta, um convite a completar (ux-shape.md §6).
  const contextStatus = deriveContextStatus(item.company, item.is_personal_project)
  // US3 (feature 026): fonte da verdade do servidor para "organizando…" — cobre tanto o disparo
  // assíncrono (salvar sem clicar em Organizar) quanto uma organização manual iniciada em outra
  // aba/sessão. Derivado ao vivo (não de `item.organizationStatus`, que `getFeedData` também
  // calcula): uma organização travada além do timeout (FR-030) precisa se autocorrigir no
  // cliente sem esperar um novo carregamento do feed — um valor congelado no momento do SSR não
  // se autocorrigiria.
  const serverOrganizationStatus = deriveOrganizationStatus(item.organized_at, item.organizing_started_at)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [sourceExpanded, setSourceExpanded] = useState(false)
  // US1 (feature 026): "Organizar" é opcional e local ao card — sem popup em falha (FR-030), sem
  // rótulo persistente além de "Organizar de novo" no sucesso (ux-shape.md §6).
  const [organizeState, setOrganizeState] = useState<OrganizeButtonState>('idle')
  // US7 (feature 026): destaques da fonte já vêm prontos em `item.highlights` (sem fetch lazy) —
  // este estado local existe só para refletir CRUD otimista (adicionar/editar/remover destaque,
  // e os destaques novos que "Organizar" insere) sem esperar um novo carregamento do feed.
  const [highlights, setHighlights] = useState<FeedHighlight[]>(item.highlights)

  // Espelha a regra de `getFeedData.ts`: com 1 destaque só, título/métrica do cabeçalho vêm DELE
  // (outcome-first, gerado pelo "Organizar") — recalculado aqui pro cabeçalho refletir, sem
  // esperar um novo carregamento da página, a substituição otimista que "Organizar de novo" faz.
  const singleHighlight = highlights.length === 1 ? highlights[0] : null
  const displayTitle = singleHighlight?.title || item.title
  const displayMetric = singleHighlight ? singleHighlight.metric : null

  const displayDate = item.entry_date ?? item.created_at
  const dateLabel = formatDate(displayDate)

  function handleConfirmDelete() {
    setDeleteOpen(false)
    onDelete?.(item.id)
  }

  /**
   * "Editar" (026) — abre o Drawer de Registro pré-preenchido com esta fonte, em vez de editar
   * um destaque ou o texto cru inline no card. Editar é sobre o REGISTRO inteiro (revisão
   * pós-implementação: destaque deixou de ter edição isolada — "editar tudo" inclui, quando há
   * só 1 destaque, os campos DELE, já que ele é o conteúdo real exibido no card, não os campos
   * legados de `entries` que a organização nunca atualiza).
   */
  function handleEditClick() {
    dispatchOpenDrawer({
      editEntry: {
        id: item.id,
        rawText: item.what_i_did,
        manualFields: {
          metric: (singleHighlight ? singleHighlight.metric : item.metric) ?? '',
          impact: (singleHighlight ? singleHighlight.impact : item.impact) ?? '',
          tags: (singleHighlight ? singleHighlight.tags : item.tags).join(', '),
          company: item.company ?? '',
          isPersonalProject: item.is_personal_project,
          entryDate: item.entry_date ?? '',
        },
        isMultiHighlight: highlights.length > 1,
      },
    })
  }

  /**
   * Dispara "Organizar" (POST /api/entries/[id]/organize, US1). Guarda de duplo clique local:
   * o botão fica `disabled` assim que `organizeState` vira 'organizing' (ux-shape.md §7).
   * Falha de IA (status: 'failed') ou de rede volta ao estado inicial silenciosamente — sem popup
   * (FR-030) — permitindo nova tentativa clicando "Organizar" de novo. "Organizar de novo"
   * SUBSTITUI os destaques existentes pelos novos (revisão pós-implementação: destaque deixou de
   * ser editável isolado — corrigir um errado é editar o texto cru e reorganizar) — sem isso, o
   * card só refletiria a nova lista depois de um novo carregamento da página.
   */
  async function handleOrganize() {
    // Idempotência (FR-031): se a organização assíncrona já está em andamento, o clique manual
    // não dispara uma segunda chamada de rede — o botão já nasce desabilitado nesse caso, este
    // guard cobre o caso defensivo de um clique disparado por outro meio (ex. Enter no foco).
    if (serverOrganizationStatus === 'organizing') return
    setOrganizeState('organizing')
    try {
      const res = await fetch(`/api/entries/${item.id}/organize`, { method: 'POST' })
      const body = (await res.json().catch(() => null)) as OrganizeResponseBody | null
      if (res.ok && body?.status === 'organized') {
        setOrganizeState('done')
        if (body.highlights) {
          setHighlights(body.highlights as FeedHighlight[])
        }
        if (variant === 'feed' && (body.company !== undefined || body.is_personal_project !== undefined)) {
          onContextChange?.(item.id, {
            company: body.company ?? null,
            isPersonalProject: body.is_personal_project ?? false,
          })
        }
      } else {
        setOrganizeState('idle')
      }
    } catch {
      setOrganizeState('idle')
    }
  }

  const highlightsCount = highlights.length

  return (
    <li id={`registro-${item.id}`} className="scroll-mt-24 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={expanded ? t('card.collapse') : t('card.expand')}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left min-h-[48px] transition-opacity hover:opacity-80"
        style={{ color: 'var(--foreground)' }}
      >
        {/* FR-027: miniatura real da imagem anexada quando existir — sem ícone genérico quando não há. */}
        {item.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura remota (bucket Supabase), não otimizável por next/image sem domínio fixo por ambiente
          <img
            src={item.thumbnail}
            alt=""
            aria-hidden="true"
            className="mt-0.5 shrink-0 rounded-md object-cover"
            style={{ width: 32, height: 32 }}
          />
        )}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="block font-display font-semibold text-[15px] leading-snug">
              {displayTitle}
            </span>
            {/* FR-025: selo de contagem só quando há mais de 1 destaque — com exatamente 1, FR-017
                já resolve isso (destaque único vem sempre aberto, sem necessidade de sinalizar). */}
            {highlightsCount > 1 && (
              <span
                className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
              >
                {t('card.highlightsBadge', { count: highlightsCount })}
              </span>
            )}
          </span>
          <span className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {displayMetric && (
              <span className="font-medium" style={{ color: 'var(--color-accent-text)' }}>
                {displayMetric}
              </span>
            )}
            <span>{dateLabel}</span>
            {item.is_personal_project ? (
              <span>· {tRegistro('context.personalProjectLabel')}</span>
            ) : (
              item.company && <span>· {item.company}</span>
            )}
            {contextStatus === 'unresolved' && (
              <span className="inline-flex items-center gap-1 italic" style={{ color: 'var(--muted-foreground)' }}>
                <span aria-hidden="true">·</span>
                <span>{tRegistro('context.unresolvedLabel')}</span>
              </span>
            )}
            {serverOrganizationStatus === 'organizing' && (
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                <span aria-hidden="true">·</span>
                <span>{tRegistro('organize.organizing')}</span>
              </span>
            )}
          </span>
        </span>
        <span className="shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(item.organized_at || variant === 'feed') && (
            <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid color-mix(in oklch, var(--border) 60%, transparent)' }}>
              {/* Selo "Organizado pelo Borogodó" só quando a IA de fato organizou esta fonte
                  (item.organized_at) — destaques só criados manualmente ("+ adicionar destaque")
                  não ganham o selo, sem precisar de um campo novo no banco para distinguir. */}
              {item.organized_at ? (
                <span
                  className="inline-flex items-center gap-1.5 flex-1 min-w-0 text-xs font-medium"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <Sparkles size={12} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                  {tRegistro('organizedBy')}
                </span>
              ) : (
                <span className="flex-1" />
              )}
              {/* Editar (026): abre o Drawer de Registro pré-preenchido com esta fonte — edição é
                  sobre o registro inteiro (revisão pós-implementação: destaque deixou de ter
                  edição/exclusão isolada — empresa/projeto pessoal e o conteúdo do destaque único
                  também se editam por aqui, não têm mais um seletor/editor próprio no card). */}
              {variant === 'feed' && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2.5 rounded-full shrink-0 transition-opacity hover:opacity-80"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <Pencil size={12} aria-hidden="true" />
                  {t('card.edit')}
                </button>
              )}
            </div>
          )}

          {/* Com 1 destaque só, o bloco de destaque seria redundante com o cabeçalho (título e
              métrica já vêm dele) — mostra só o impacto, sem chrome/box, como um preview de
              conteúdo. Com 2+, nenhum título/métrica isolado representa a fonte inteira, então o
              `HighlightCard` de cada um continua necessário. */}
          {singleHighlight?.impact && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              {singleHighlight.impact}
            </p>
          )}

          {highlights.length > 1 && (
            <div className="flex flex-col gap-2">
              {highlights.map((highlight, index) => (
                <HighlightCard key={highlight.id} highlight={highlight} index={index + 1} defaultOpen={false} />
              ))}
            </div>
          )}

          {item.evidences.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.evidences.map((evidence, index) => (
                <AttachTile
                  key={`${evidence.type}-${evidence.value}-${index}`}
                  kind={evidence.type === 'image' ? 'image' : 'link'}
                  previewUrl={evidence.value}
                  label={evidence.label}
                />
              ))}
            </div>
          )}

          {item.source === 'linkedin_pdf' && item.file_name && (
            <span
              className="inline-flex items-center gap-1.5 self-start text-xs px-2 py-0.5 rounded-full max-w-full"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              title={item.file_name}
            >
              <Paperclip size={12} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{item.file_name}</span>
            </span>
          )}

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setSourceExpanded((v) => !v)}
              className="self-start text-xs font-medium min-h-[44px] transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
            >
              {sourceExpanded ? t('card.hideFull') : t('card.viewFull')}
            </button>
            {sourceExpanded && (
              <p
                className="text-sm leading-relaxed overflow-y-auto rounded-lg border p-3"
                style={{
                  color: 'var(--muted-foreground)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 280,
                  borderColor: 'var(--border)',
                  background: 'var(--muted)',
                }}
              >
                {item.what_i_did}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <UsarButton
              seedType="entry"
              seedRef={item.id}
              seedSummary={item.what_i_did}
              formats={['post', 'impact_summary']}
            />

            {variant === 'feed' && (() => {
              // US3: o botão reflete tanto o clique manual local (`organizeState`) quanto a
              // organização assíncrona em andamento no servidor (`serverOrganizationStatus`) —
              // qualquer um dos dois basta para mostrar "organizando…" e desabilitar (FR-031).
              const isOrganizingNow = organizeState === 'organizing' || serverOrganizationStatus === 'organizing'
              const isOrganizedAlready = organizeState === 'done' || serverOrganizationStatus === 'organized'
              return (
                <button
                  type="button"
                  onClick={() => void handleOrganize()}
                  disabled={isOrganizingNow}
                  className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <Sparkles size={12} aria-hidden="true" />
                  {isOrganizingNow
                    ? tRegistro('organize.organizing')
                    : isOrganizedAlready
                      ? tRegistro('organize.ctaAgain')
                      : tRegistro('organize.cta')}
                </button>
              )
            })()}

            {variant === 'feed' && onDelete && (
              <button
                type="button"
                aria-label={t('card.delete')}
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium px-4 py-2.5 rounded-full transition-opacity hover:opacity-80"
                style={{ color: 'var(--destructive)' }}
              >
                <Trash2 size={12} aria-hidden="true" />
                {t('card.delete')}
              </button>
            )}
          </div>
        </div>
      )}

      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-40"
            style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(2px)' }}
          />
          <Dialog.Content
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,380px)] rounded-2xl p-6 flex flex-col gap-5 focus:outline-none"
            style={{ background: 'var(--color-creme)', boxShadow: 'var(--shadow-modal)' }}
          >
            <div className="flex flex-col gap-1.5">
              <Dialog.Title className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                {t('card.deleteConfirm.title')}
              </Dialog.Title>
              <Dialog.Description className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('card.deleteConfirm.description')}
              </Dialog.Description>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {t('card.deleteConfirm.cancel')}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 min-h-[48px] rounded-lg transition-opacity hover:opacity-90"
                style={{ background: 'var(--destructive)', color: 'var(--color-primary-fg)' }}
              >
                {t('card.deleteConfirm.confirm')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </li>
  )
}
