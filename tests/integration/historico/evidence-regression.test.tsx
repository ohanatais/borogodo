import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { groupCompanies, type EvidenceItem, type RawEntry } from '@/lib/historico/getHistoricoData'
import { HistoricoTimeline } from '@/components/features/historico/HistoricoTimeline'
import { EvidenceSection } from '@/components/features/historico/EvidenceSection'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

/**
 * T073 (025, Phase 10) — regressão: `/historico`/`EvidenceSection.tsx` continuam funcionando com
 * registros antigos (`kind: 'text'`/`'marco'`, pré-existentes) convivendo com os novos
 * `kind: 'deposito'` (Drawer). `getHistoricoData`/`groupCompanies`/`EvidenceSection` nunca leem o
 * campo `kind` — a query em `getHistoricoData.ts` nem o seleciona — então a superfície real de
 * regressão é: mesma company/project agrupando entries de ambas as origens, evidências dos dois
 * formatos (`url`/`image`) convivendo, e entradas legadas sem evidência (`evidences: []`, default
 * da migration 007) não quebrando ao lado de entradas novas com anexos.
 */

const LEGACY_TEXT_ENTRY: RawEntry = {
  id: 'legacy-text-1',
  role_title: 'Product Manager',
  company: 'Acme Corp',
  role_start: '2021-01-01',
  role_end: null,
  what_i_did: 'Lançou o programa de onboarding self-serve',
  impact: 'Reduziu tempo de ativação em 30%',
  metric: '30%',
  project_name: 'Onboarding',
  // Caminho antigo (`kind: 'text'`, captura via IA) — evidência adicionada manualmente depois via
  // a mesma rota `POST /api/entries/[id]/evidence` (research.md §4).
  evidences: [{ type: 'url', value: 'https://acme.com/case-study', label: 'Case study' }],
}

const LEGACY_MARCO_ENTRY: RawEntry = {
  id: 'legacy-marco-1',
  role_title: 'Product Manager',
  company: 'Acme Corp',
  role_start: '2021-01-01',
  role_end: null,
  what_i_did: 'Marco: primeiro milhão de usuários ativos',
  impact: null,
  metric: null,
  project_name: 'Onboarding',
  // Entrada legada sem nenhuma evidência anexada — cobre o default `NOT NULL DEFAULT '[]'` da
  // migration 007 convivendo com entradas novas que têm anexos.
  evidences: [],
}

const NEW_DEPOSITO_ENTRY: RawEntry = {
  id: 'deposito-1',
  role_title: 'Product Manager',
  company: 'Acme Corp',
  role_start: '2021-01-01',
  role_end: null,
  what_i_did: 'Resolvi o bug de checkout duplicado',
  impact: null,
  metric: null,
  project_name: 'Onboarding',
  // Anexo de imagem salvo pelo Drawer (US2) via a mesma rota de evidência — mesmo formato
  // `EvidenceItem` usado pelo caminho antigo.
  evidences: [{ type: 'image', value: 'https://cdn.borogodo.app/evidence/print.png', label: 'Print do bug' }],
}

const NEW_DEPOSITO_STANDALONE: RawEntry = {
  id: 'deposito-2',
  role_title: null,
  company: 'Acme Corp',
  role_start: null,
  role_end: null,
  what_i_did: 'Documentei o fluxo de suporte em uma página',
  impact: null,
  metric: null,
  project_name: null,
  evidences: [],
}

describe('Regressão US /historico — registros antigos e novos convivendo (T073)', () => {
  it('agrupa entries de kind antigo (text/marco) e novo (deposito) na mesma company/project sem perder nenhuma', () => {
    const companies = groupCompanies([LEGACY_TEXT_ENTRY, LEGACY_MARCO_ENTRY, NEW_DEPOSITO_ENTRY, NEW_DEPOSITO_STANDALONE])

    expect(companies).toHaveLength(1)
    const [acme] = companies
    expect(acme.company).toBe('Acme Corp')

    const onboarding = acme.projects.find((p) => p.name === 'Onboarding')
    expect(onboarding).toBeDefined()
    expect(onboarding!.entries.map((e) => e.id).sort()).toEqual(
      ['deposito-1', 'legacy-marco-1', 'legacy-text-1'].sort()
    )

    // Entrada avulsa (sem project_name) do caminho novo também entra como standalone/highlight,
    // igual entraria uma entrada avulsa do caminho antigo.
    expect(acme.highlight_bullets).toContain('Documentei o fluxo de suporte em uma página')
  })

  it('preserva evidências (url e image) de entries antigas e novas no mesmo project sem crash', () => {
    const [acme] = groupCompanies([LEGACY_TEXT_ENTRY, LEGACY_MARCO_ENTRY, NEW_DEPOSITO_ENTRY])
    const onboarding = acme.projects.find((p) => p.name === 'Onboarding')!

    const legacyEntry = onboarding.entries.find((e) => e.id === 'legacy-text-1')!
    const marcoEntry = onboarding.entries.find((e) => e.id === 'legacy-marco-1')!
    const depositoEntry = onboarding.entries.find((e) => e.id === 'deposito-1')!

    expect(legacyEntry.evidences).toEqual<EvidenceItem[]>([
      { type: 'url', value: 'https://acme.com/case-study', label: 'Case study' },
    ])
    expect(marcoEntry.evidences).toEqual([])
    expect(depositoEntry.evidences).toEqual<EvidenceItem[]>([
      { type: 'image', value: 'https://cdn.borogodo.app/evidence/print.png', label: 'Print do bug' },
    ])
  })

  it('renderiza HistoricoTimeline com o projeto aberto contendo entries antigas e novas lado a lado', () => {
    const [acme] = groupCompanies([LEGACY_TEXT_ENTRY, LEGACY_MARCO_ENTRY, NEW_DEPOSITO_ENTRY])
    const project = acme.projects.find((p) => p.name === 'Onboarding')!
    const noop = () => undefined

    render(
      <HistoricoTimeline
        data={{ companies: [acme] }}
        activeProject={{ company: acme.company, project }}
        onSelectProject={noop}
        onCloseProject={noop}
        onStartCapture={noop}
      />
    )

    // HistoricoTimeline monta o ProjectDetailPanel em dois lugares (drawer mobile + coluna
    // desktop) simultaneamente no DOM de teste (a diferença é só CSS de viewport) — por isso
    // `getAllByText` em vez de `getByText`.
    expect(screen.getAllByText('Lançou o programa de onboarding self-serve').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Marco: primeiro milhão de usuários ativos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Resolvi o bug de checkout duplicado').length).toBeGreaterThan(0)
  })

  it('EvidenceSection renderiza evidência de link (caminho antigo) e de imagem (Drawer novo) juntas', () => {
    render(
      <EvidenceSection
        entryId="mixed-entry"
        initial={[
          { type: 'url', value: 'https://acme.com/case-study', label: 'Case study' },
          { type: 'image', value: 'https://cdn.borogodo.app/evidence/print.png', label: 'Print do bug' },
        ]}
      />
    )

    expect(screen.getByText('Case study')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Print do bug' })).toBeInTheDocument()
  })

  it('EvidenceSection não quebra para entrada legada sem nenhuma evidência (default `[]` da migration 007)', () => {
    render(<EvidenceSection entryId="legacy-no-evidence" initial={[]} />)

    expect(screen.getByText('Evidências')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
