import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'
import type { EvidenceItem } from '@/lib/historico/getHistoricoData'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

const urlBodySchema = z.object({
  type: z.literal('url'),
  value: z.string().url(),
  label: z.string().max(200).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const contentType = req.headers.get('content-type') ?? ''
  let item: EvidenceItem

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const label = (formData.get('label') as string | null) ?? undefined

    if (!file) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: 'Arquivo muito grande (máx 10 MB).' }, { status: 400 })
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato inválido. Use JPEG, PNG, WebP ou GIF.' }, { status: 400 })
    }

    const path = `${user.id}/${id}/${Date.now()}`
    const { error: uploadError } = await supabase.storage
      .from('evidence-files')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (uploadError) return NextResponse.json({ error: 'Erro ao enviar imagem.' }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('evidence-files').getPublicUrl(path)
    item = { type: 'image', value: publicUrl, ...(label ? { label } : {}) }
  } else {
    const body = await req.json().catch(() => null)
    const parsed = urlBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })
    }
    item = parsed.data
  }

  const { data: entry } = await supabase
    .from('entries')
    .select('id, evidences')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Entrada não encontrada' }, { status: 404 })

  const current = (entry.evidences as EvidenceItem[]) ?? []
  const updated = [...current, item]

  const { error } = await supabase
    .from('entries')
    .update({ evidences: updated })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 })

  return NextResponse.json({ evidences: updated })
}
