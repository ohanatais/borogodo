'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerClient } from '@/lib/db/supabase/server'

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  linkedin_url: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().url().nullable().optional()
  ),
  github_url: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().url().nullable().optional()
  ),
})

type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>

export async function updateProfileAction(
  data: ProfileUpdateInput
): Promise<{ error?: string }> {
  const parsed = ProfileUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar. Tente de novo.' }

  revalidatePath('/configuracoes')
  revalidatePath('/', 'layout')
  return {}
}

export async function uploadAvatarAction(
  formData: FormData
): Promise<{ error?: string; url?: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const file = formData.get('avatar') as File | null
  if (!file) return { error: 'Arquivo não encontrado' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Foto muito grande (máx 5 MB).' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Formato inválido. Use JPEG, PNG ou WebP.' }
  }

  const path = `${user.id}/avatar`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: 'Erro ao enviar foto.' }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path)

  const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: cacheBustedUrl })
    .eq('id', user.id)

  if (profileError) return { error: 'Erro ao atualizar perfil.' }

  revalidatePath('/configuracoes')
  revalidatePath('/', 'layout')
  return { url: cacheBustedUrl }
}
