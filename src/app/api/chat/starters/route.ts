import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'

const STATIC_STARTERS = [
  'Quais são meus maiores pontos fortes?',
  'Que projetos tiveram mais impacto na minha carreira?',
  'O que ainda não aparece no meu espelho?',
]

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ starters: STATIC_STARTERS })

  const { data: entries } = await supabase
    .from('entries')
    .select('company, tags, entry_date, what_i_did')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!entries || entries.length === 0) {
    return NextResponse.json({ starters: STATIC_STARTERS })
  }

  const starters: string[] = []

  // Starter based on most common company
  const companyCounts = new Map<string, number>()
  for (const e of entries) {
    if (e.company) companyCounts.set(e.company, (companyCounts.get(e.company) ?? 0) + 1)
  }
  const topCompany = [...companyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  if (topCompany) {
    starters.push(`O que aprendi durante o tempo em ${topCompany}?`)
  }

  // Starter based on most common tag
  const tagCounts = new Map<string, number>()
  for (const e of entries) {
    for (const tag of e.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }
  const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  if (topTag && starters.length < 3) {
    starters.push(`Quais projetos de ${topTag} tiveram mais impacto?`)
  }

  // Starter based on recency — use company name rather than embedding raw text
  // to avoid sending a truncated mid-word snippet as a literal chat message.
  const recentEntry = entries[0]
  if (recentEntry && starters.length < 3) {
    const ref = recentEntry.company ?? null
    starters.push(
      ref
        ? `O que aprendi de mais importante na ${ref}?`
        : 'O que minha trajetória mais recente diz sobre mim?'
    )
  }

  // Fill with statics if we don't have 3
  for (const s of STATIC_STARTERS) {
    if (starters.length >= 3) break
    starters.push(s)
  }

  return NextResponse.json(
    { starters: starters.slice(0, 3) },
    { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600' } }
  )
}
