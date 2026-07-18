'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

// Acima desse tamanho, a fileira de pílulas ganha busca inline em vez de crescer em altura
// indefinidamente (ux-shape.md §6/§7, edge case da spec: vocabulário de empresas sem limite).
const SEARCH_THRESHOLD = 8

interface ContextPillPickerProps {
  /** Presente (Registros, pós-salvar): seleção dispara `PATCH` direto no servidor. Ausente
   * (Drawer, antes de salvar): seleção fica só local — nenhuma chamada de rede, `onChange`
   * decide o que fazer com o valor (o rascunho ainda nem tem uma fonte salva pra atualizar). */
  entryId?: string
  /** `company` atual da fonte — `null` quando ainda não resolvida (nem empresa, nem "Outro"). */
  company: string | null
  /** `true` quando a pílula "Projeto pessoal" já foi selecionada. */
  isPersonalProject: boolean
  /** Vocabulário de contextos da pessoa (`getContextVocabulary`) — empresas já usadas, sem "Projeto pessoal"/"Outro" (que são fixas). */
  vocabulary: string[]
  /** Notifica o pai do novo contexto resolvido, após o PATCH confirmar sucesso (atualização otimista local). */
  onChange: (next: { company: string | null; isPersonalProject: boolean }) => void
}

interface ContextSelection {
  company: string | null
  isPersonalProject: boolean
}

async function patchContext(entryId: string, selection: ContextSelection): Promise<boolean> {
  try {
    const res = await fetch(`/api/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: selection.company, is_personal_project: selection.isPersonalProject }),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Seletor de contexto por pílulas (Story 2, US2, feature 026) — empresas já usadas pela pessoa +
 * "Projeto pessoal" + "Outro" (texto livre). Seleção dispara `PATCH` direto, sem chamada de IA
 * (FR-003, custo zero, SC-007) — a precedência sobre a inferência automática (FR-004) é garantida
 * do lado do servidor (`organizeEntry`/regra "só preenche vazios"), não aqui.
 */
export function ContextPillPicker({ entryId, company, isPersonalProject, vocabulary, onChange }: ContextPillPickerProps) {
  const t = useTranslations('registro')
  const [pending, setPending] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherValue, setOtherValue] = useState('')
  const [search, setSearch] = useState('')

  // A empresa atual sempre aparece como pílula, mesmo quando ainda não faz parte do vocabulário
  // histórico (ex.: acabou de ser inferida pelo "Organizar", ou resolvida via "Outro" numa sessão
  // anterior) — sem isso, o valor real ficava "invisível" no seletor (nenhuma pílula acesa).
  const vocabularyWithCurrent = useMemo(() => {
    if (!company || vocabulary.includes(company)) return vocabulary
    return [...vocabulary, company]
  }, [vocabulary, company])

  const visibleVocabulary = useMemo(() => {
    if (vocabularyWithCurrent.length <= SEARCH_THRESHOLD) return vocabularyWithCurrent
    if (!search.trim()) return vocabularyWithCurrent
    const needle = search.trim().toLowerCase()
    return vocabularyWithCurrent.filter((name) => name.toLowerCase().includes(needle))
  }, [vocabularyWithCurrent, search])

  async function select(selection: ContextSelection) {
    if (!entryId) {
      onChange(selection)
      return
    }
    setPending(true)
    const ok = await patchContext(entryId, selection)
    setPending(false)
    if (ok) onChange(selection)
  }

  function handleOtherConfirm() {
    const trimmed = otherValue.trim()
    setOtherOpen(false)
    setOtherValue('')
    if (!trimmed) return
    void select({ company: trimmed, isPersonalProject: false })
  }

  return (
    <div className="flex flex-col gap-2">
      {vocabularyWithCurrent.length > SEARCH_THRESHOLD && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('context.searchPlaceholder')}
          aria-label={t('context.searchPlaceholder')}
          className="text-sm rounded-lg px-3 py-2 min-h-[48px] border w-full max-w-xs"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {visibleVocabulary.map((name) => {
          const active = !isPersonalProject && company === name
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              disabled={pending}
              onClick={() => void select({ company: name, isPersonalProject: false })}
              className="inline-flex items-center text-xs font-medium px-4 py-2.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
              style={
                active
                  ? { background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }
                  : { background: 'var(--muted)', color: 'var(--foreground)' }
              }
            >
              {name}
            </button>
          )
        })}

        <button
          type="button"
          aria-pressed={isPersonalProject}
          disabled={pending}
          onClick={() => void select({ company: null, isPersonalProject: true })}
          className="inline-flex items-center text-xs font-medium px-4 py-2.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
          style={
            isPersonalProject
              ? { background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }
              : { background: 'var(--muted)', color: 'var(--foreground)' }
          }
        >
          {t('context.personalProjectLabel')}
        </button>

        {otherOpen ? (
          <input
            type="text"
            autoFocus
            value={otherValue}
            aria-label={t('context.otherLabel')}
            placeholder={t('context.otherPlaceholder')}
            onChange={(e) => setOtherValue(e.target.value)}
            onBlur={handleOtherConfirm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleOtherConfirm()
              if (e.key === 'Escape') {
                setOtherOpen(false)
                setOtherValue('')
              }
            }}
            className="text-xs rounded-full px-4 py-2.5 border"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setOtherOpen(true)}
            className="inline-flex items-center text-xs font-medium px-4 py-2.5 rounded-full border border-dashed transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {t('context.otherLabel')}
          </button>
        )}
      </div>
    </div>
  )
}
