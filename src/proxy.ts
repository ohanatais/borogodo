import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/db/supabase/middleware'
import { LEGAL_ROUTES } from './lib/legal/policy'

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_ROUTES = ['/', '/login', '/auth/callback', LEGAL_ROUTES.terms, LEGAL_ROUTES.privacy]

function isPublicRoute(pathname: string): boolean {
  // Com localePrefix: 'never' (next-intl) as URLs nunca têm prefixo de locale,
  // então comparamos o pathname diretamente.
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

function transferCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, { path: '/' })
  })
}

export default async function proxy(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    transferCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/painel'
    const redirectResponse = NextResponse.redirect(url)
    transferCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  // Route handlers (e.g. /auth/callback) don't need i18n processing
  if (pathname.startsWith('/auth/')) {
    return supabaseResponse
  }

  const intlResponse = intlMiddleware(request)

  // next-intl com localePrefix:'never' pode retornar um redirect 307 para a mesma URL
  // sem Set-Cookie (para "negociar" locale). Isso causa ERR_TOO_MANY_REDIRECTS.
  // Detecta o self-redirect e usa o supabaseResponse (NextResponse.next) em vez disso.
  const location = intlResponse.headers.get('location')
  const isSelfRedirect =
    intlResponse.status >= 300 &&
    intlResponse.status < 400 &&
    location !== null &&
    new URL(location, request.url).pathname === pathname

  if (isSelfRedirect) {
    transferCookies(supabaseResponse, supabaseResponse)
    return supabaseResponse
  }

  transferCookies(supabaseResponse, intlResponse)
  return intlResponse
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
