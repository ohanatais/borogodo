import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Megaphone, ClipboardCheck } from 'lucide-react'

export default async function UsarPage() {
  const t = await getTranslations('usar')

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-9 pt-10 pb-24 w-full">
      <header className="mb-8">
        <h1
          className="text-2xl lg:text-3xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {t('title')}
        </h1>
        <p className="mt-2 text-base" style={{ color: 'var(--muted-foreground)' }}>
          {t('subtitle')}
        </p>
      </header>

      {/* Duas zonas lado a lado, peso visual igual; empilham no mobile. Sem card-grid repetido. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pra fora — Conteúdo */}
        <Link
          href="/presenca"
          className="group flex flex-col gap-4 rounded-2xl p-6 min-h-44 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          style={{ background: 'var(--color-lilas-nevoa)', outlineColor: 'var(--color-primary)' }}
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ background: 'oklch(100% 0 0 / 0.6)', color: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            <Megaphone size={24} />
          </span>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-lilas-nevoa-text)' }}>
              {t('conteudo.label')}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-lilas-nevoa-text)' }}>
              {t('conteudo.when')}
            </p>
          </div>
        </Link>

        {/* Pra dentro — Preparo */}
        <Link
          href="/autoavaliacao"
          className="group flex flex-col gap-4 rounded-2xl p-6 min-h-44 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          style={{ background: 'var(--color-warm)', outlineColor: 'var(--color-primary)' }}
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ background: 'oklch(100% 0 0 / 0.6)', color: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            <ClipboardCheck size={24} />
          </span>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-warm-text)' }}>
              {t('preparo.label')}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-warm-text)' }}>
              {t('preparo.when')}
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
