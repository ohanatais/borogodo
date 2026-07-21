import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Megaphone, ClipboardCheck } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'

/**
 * Splash de intenção (021): a pessoa escolhe MOSTRAR (pra fora) ou PREPARAR (pra dentro) antes de
 * entrar no Repertório. Cada caminho leva a um hub ESCOPADO (`?hub=`) — o destino mostra só aquele
 * hub, não os dois. A clareza do splash + o foco do hub escopado é a ideia central da reforma.
 */
export default async function UsarPage() {
  const t = await getTranslations('usar')

  return (
    <PageContainer className="pb-28 lg:pb-10">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Duas zonas lado a lado, peso visual igual; empilham no mobile. Sem card-grid repetido. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pra fora — Conteúdo → hub MOSTRAR escopado */}
        <div
          aria-disabled="true"
          className="flex min-h-44 cursor-not-allowed flex-col gap-4 rounded-2xl p-6 opacity-60"
          style={{ background: 'var(--color-lilas-nevoa)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: 'oklch(100% 0 0 / 0.6)', color: 'var(--color-primary)' }}
              aria-hidden="true"
            >
              <Megaphone size={24} />
            </span>
            <span className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              {t('comingSoon')}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-lilas-nevoa-text)' }}>
              {t('conteudo.label')}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-lilas-nevoa-text)' }}>
              {t('conteudo.when')}
            </p>
          </div>
        </div>

        {/* Pra dentro — Preparo → hub PREPARAR escopado */}
        <Link
          href="/presenca?hub=preparar"
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
    </PageContainer>
  )
}
