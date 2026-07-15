import { describe, it, expect, vi } from 'vitest'
import { getTagVocabulary } from '../highlightVocabulary'

function makeClient(rows: { tags: string[] }[] | null, error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ data: rows, error })
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) => {
    if (table !== 'entries') throw new Error(`Unexpected table: ${table}`)
    return { select }
  })

  return { client: { from } as unknown as { from: typeof from }, from, select, eq }
}

describe('getTagVocabulary', () => {
  it('retorna a união de tags distintas do usuário (entries + rollup de entry_highlights), ordenada', async () => {
    const { client } = makeClient([{ tags: ['devops', 'liderança'] }, { tags: ['devops'] }])

    const result = await getTagVocabulary(client as never, 'user-1')

    expect(result).toEqual(['devops', 'liderança'])
  })

  it('filtra por user_id na query', async () => {
    const { client, eq } = makeClient([])

    await getTagVocabulary(client as never, 'user-42')

    expect(eq).toHaveBeenCalledWith('user_id', 'user-42')
  })

  it('retorna array vazio quando não há tags (primeiro uso)', async () => {
    const { client } = makeClient([])

    const result = await getTagVocabulary(client as never, 'user-1')

    expect(result).toEqual([])
  })

  it('retorna array vazio em caso de erro, sem lançar', async () => {
    const { client } = makeClient(null, new Error('db error'))

    const result = await getTagVocabulary(client as never, 'user-1')

    expect(result).toEqual([])
  })
})
