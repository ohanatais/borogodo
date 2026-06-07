import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/painel`, { status: 307 })
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`, { status: 307 })
}
