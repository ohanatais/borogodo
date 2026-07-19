import { describe, it, expect, vi } from 'vitest'
import { tryAcquireOrganizingLock } from '../organizingLock'

/**
 * `tryAcquireOrganizingLock` substitui o padrão anterior de "ler o valor, depois escrever" por um
 * único `UPDATE ... WHERE organizing_started_at IS NULL OR organizing_started_at < cutoff` —
 * achado do code-review high da feature 026: o padrão antigo tinha uma corrida real entre o
 * clique manual (`POST /organize`, US1) e o disparo assíncrono no salvar (`triggerOrganizeEntry`,
 * US3), que podiam ambos ler `organizing_started_at` como `null` antes de qualquer um escrever o
 * lock. Estes testes cobrem os três desfechos do `UPDATE` condicional, sem depender de timing real
 * (a atomicidade em si vem do Postgres, não é reproduzível de forma determinística em mock).
 */
function makeSupabase(options: { updateMatched: boolean; existingRow?: { id: string } | null; updateError?: unknown }) {
  const { updateMatched, existingRow = null, updateError = null } = options

  const updateBuilder = {
    update: vi.fn(() => updateBuilder),
    eq: vi.fn(() => updateBuilder),
    or: vi.fn(() => updateBuilder),
    select: vi.fn(async () => ({
      data: updateError ? null : updateMatched ? [{ id: 'entry-1' }] : [],
      error: updateError,
    })),
  }

  const selectBuilder = {
    select: vi.fn(() => selectBuilder),
    eq: vi.fn(() => selectBuilder),
    maybeSingle: vi.fn(async () => ({ data: existingRow, error: null })),
  }

  let callCount = 0
  const from = vi.fn(() => {
    callCount += 1
    return callCount === 1 ? updateBuilder : selectBuilder
  })

  return { from } as unknown as Parameters<typeof tryAcquireOrganizingLock>[0]
}

describe('tryAcquireOrganizingLock', () => {
  it('retorna "acquired" quando o UPDATE condicional casa a linha (nenhum lock ativo)', async () => {
    const supabase = makeSupabase({ updateMatched: true })

    const result = await tryAcquireOrganizingLock(supabase, 'entry-1', 'user-1')

    expect(result).toBe('acquired')
  })

  it('retorna "already_organizing" quando o UPDATE não casa nenhuma linha mas a fonte existe (lock recente segurado por outra chamada)', async () => {
    const supabase = makeSupabase({ updateMatched: false, existingRow: { id: 'entry-1' } })

    const result = await tryAcquireOrganizingLock(supabase, 'entry-1', 'user-1')

    expect(result).toBe('already_organizing')
  })

  it('retorna "not_found" quando o UPDATE não casa nenhuma linha e a fonte não existe/não é do usuário', async () => {
    const supabase = makeSupabase({ updateMatched: false, existingRow: null })

    const result = await tryAcquireOrganizingLock(supabase, 'entry-1', 'user-1')

    expect(result).toBe('not_found')
  })

  it('lança quando o UPDATE falha por erro de infra — o chamador decide como tratar (5xx na rota, log no job)', async () => {
    const supabase = makeSupabase({ updateMatched: false, updateError: new Error('conexão perdida') })

    await expect(tryAcquireOrganizingLock(supabase, 'entry-1', 'user-1')).rejects.toThrow('conexão perdida')
  })
})
