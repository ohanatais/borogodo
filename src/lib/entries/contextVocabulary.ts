import type { createServerClient } from '@/lib/db/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

interface EntryCompanyRow {
  company: string
}

/**
 * Vocabulário de contextos (empresas) já usado pela pessoa (Story 2, feature 026) — alimenta o
 * `ContextPillPicker` junto com as pílulas fixas "Projeto pessoal"/"Outro" (que não vêm do banco).
 *
 * "Outro" grava o texto novo direto em `entries.company` — no próximo registro, esta mesma query
 * já o traz de volta como pílula (FR-005), sem precisar de tabela nova (ver data-model.md).
 *
 * Em erro, devolve array vazio (o seletor mostra só as pílulas fixas em vez de falhar a tela).
 */
export async function getContextVocabulary(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('company')
    .eq('user_id', userId)
    .not('company', 'is', null)
    .order('company', { ascending: true })

  if (error || !data) return []

  const rows = data as EntryCompanyRow[]
  return Array.from(new Set(rows.map((row) => row.company)))
}
