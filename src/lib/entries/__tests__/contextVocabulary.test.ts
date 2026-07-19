import { describe, it, expect, vi } from 'vitest'
import { getContextVocabulary } from '../contextVocabulary'

function makeClient(rows: { company: string }[] | null, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error })
  const not = vi.fn(() => ({ order }))
  const eq = vi.fn(() => ({ not }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) => {
    if (table !== 'entries') throw new Error(`Unexpected table: ${table}`)
    return { select }
  })

  return { client: { from } as unknown as { from: typeof from }, from, select, eq, not, order }
}

describe('getContextVocabulary', () => {
  it('retorna as empresas distintas do usuário, ordenadas, excluindo null', async () => {
    const { client } = makeClient([{ company: 'Acme Corp' }, { company: 'Beta Ltda' }])

    const result = await getContextVocabulary(client as never, 'user-1')

    expect(result).toEqual(['Acme Corp', 'Beta Ltda'])
  })

  it('filtra por user_id e company not null, ordenando por company', async () => {
    const { client, eq, not, order } = makeClient([])

    await getContextVocabulary(client as never, 'user-42')

    expect(eq).toHaveBeenCalledWith('user_id', 'user-42')
    expect(not).toHaveBeenCalledWith('company', 'is', null)
    expect(order).toHaveBeenCalledWith('company', { ascending: true })
  })

  it('retorna array vazio quando não há empresa nenhuma (primeiro uso)', async () => {
    const { client } = makeClient([])

    const result = await getContextVocabulary(client as never, 'user-1')

    expect(result).toEqual([])
  })

  it('deduplica empresas repetidas', async () => {
    const { client } = makeClient([{ company: 'Acme Corp' }, { company: 'Acme Corp' }])

    const result = await getContextVocabulary(client as never, 'user-1')

    expect(result).toEqual(['Acme Corp'])
  })

  it('retorna array vazio em caso de erro, sem lançar', async () => {
    const { client } = makeClient(null, new Error('db error'))

    const result = await getContextVocabulary(client as never, 'user-1')

    expect(result).toEqual([])
  })
})
