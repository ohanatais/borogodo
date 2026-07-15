import { describe, it, expect, vi } from 'vitest'
import { rollupEntryTags } from '../rollupEntryTags'

function makeClient({
  highlightRows = [] as { tags: string[] }[],
  selectError = null as unknown,
  updateError = null as unknown,
} = {}) {
  const selectEq = vi.fn().mockResolvedValue({ data: highlightRows, error: selectError })
  const select = vi.fn(() => ({ eq: selectEq }))

  const updateEq = vi.fn().mockResolvedValue({ error: updateError })
  const update = vi.fn(() => ({ eq: updateEq }))

  const from = vi.fn((table: string) => {
    if (table === 'entry_highlights') return { select }
    if (table === 'entries') return { update }
    throw new Error(`Unexpected table: ${table}`)
  })

  return { client: { from } as unknown as { from: typeof from }, select, selectEq, update, updateEq }
}

describe('rollupEntryTags', () => {
  it('une as tags de todos os destaques de uma fonte, sem duplicatas, ordenadas', async () => {
    const { client } = makeClient({
      highlightRows: [{ tags: ['devops', 'liderança'] }, { tags: ['devops', 'comunicação'] }],
    })

    const result = await rollupEntryTags(client as never, 'entry-1')

    expect(result).toEqual(['comunicação', 'devops', 'liderança'])
  })

  it('persiste o rollup em entries.tags para a fonte', async () => {
    const { client, updateEq, update } = makeClient({
      highlightRows: [{ tags: ['devops'] }],
    })

    await rollupEntryTags(client as never, 'entry-1')

    expect(update).toHaveBeenCalledWith({ tags: ['devops'] })
    expect(updateEq).toHaveBeenCalledWith('id', 'entry-1')
  })

  it('retorna array vazio quando a fonte não tem nenhum destaque', async () => {
    const { client } = makeClient({ highlightRows: [] })

    const result = await rollupEntryTags(client as never, 'entry-1')

    expect(result).toEqual([])
  })

  it('não lança e retorna array vazio em erro de leitura', async () => {
    const { client } = makeClient({ selectError: new Error('db error') })

    const result = await rollupEntryTags(client as never, 'entry-1')

    expect(result).toEqual([])
  })
})
