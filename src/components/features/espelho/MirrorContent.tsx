'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { RefreshCw, MessageSquare } from 'lucide-react'
import type { MirrorSnapshot } from '@/types/mirror'
import { MirrorFeedback } from './MirrorFeedback'
import { EvidenceText } from './EvidenceText'
import { MacroCategoryTabs } from './MacroCategoryTabs'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { AiLimitNotice } from '@/components/features/cost/AiLimitNotice'
import { parseAiLimit, type AiLimitInfo } from '@/lib/ai/cost/clientLimit'

interface MirrorContentProps {
  snapshot: MirrorSnapshot
  userName?: string
  avatarUrl?: string | null
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface SectionProps {
  label: string
  headline: string
  evidence: unknown
  warm?: boolean
  primary?: boolean
}

function MirrorSection({ label, headline, evidence, warm = false, primary = false }: SectionProps) {
  return (
    <motion.div
      variants={item}
      className="group relative py-6 rounded-lg px-4 mb-2 border-b"
      style={{
        borderBottomColor: warm ? 'transparent' : 'var(--border)',
        background: primary
          ? 'oklch(42% 0.19 320 / 0.04)'
          : warm
          ? 'oklch(74% 0.12 75 / 0.12)'
          : 'transparent',
      }}
    >
      <SectionLabel className="mb-2">{label}</SectionLabel>
      <p className={`${primary ? 'text-2xl' : 'text-xl'} font-semibold mb-2`} style={{ color: 'var(--foreground)' }}>
        {headline}
      </p>
      <EvidenceText evidence={evidence} />

    </motion.div>
  )
}

function MirrorHeader({ name, label, avatarUrl }: { name: string; label: string; avatarUrl?: string | null }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex items-center gap-4 mb-8">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="flex-shrink-0 w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </p>
        <p className="text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {name}
        </p>
      </div>
    </div>
  )
}

export function MirrorContent({ snapshot, userName = '', avatarUrl }: MirrorContentProps) {
  const t = useTranslations('espelho')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [aiLimit, setAiLimit] = useState<AiLimitInfo | null>(null)
  const { mirror } = snapshot

  const personName = userName || mirror.intro.match(/^([A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+)/)?.[1] || ''

  const handleRegenerate = async () => {
    setLoading(true)
    setRegenerateError(null)
    setAiLimit(null)
    try {
      const res = await fetch('/api/mirror/generate', { method: 'POST' })
      if (!res.ok) {
        const limit = await parseAiLimit(res)
        if (limit) {
          setAiLimit(limit)
          return
        }
        const body = await res.json().catch(() => ({})) as { error?: string }
        setRegenerateError(body.error ?? t('regenerateError'))
        return
      }
      router.refresh()
    } catch {
      setRegenerateError(t('regenerateError'))
    } finally {
      setLoading(false)
    }
  }

  function handleAskAboutMirror() {
    window.dispatchEvent(
      new CustomEvent('borogodo:chat-open', {
        detail: { context: { type: 'espelho' } },
      })
    )
  }

  return (
    // Container (largura/padding) é do /espelho: este é uma vista dentro do segmented control,
    // não uma página própria. Só ritmo vertical aqui — assim Forças e Trajetória alinham na
    // mesma margem esquerda do toggle (021).
    <div className="pb-2">
      {personName && <MirrorHeader name={personName} label={t('mirrorOf')} avatarUrl={avatarUrl} />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <button
          type="button"
          onClick={handleAskAboutMirror}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
          style={{
            background: 'var(--color-lilas-nevoa)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary)',
          }}
        >
          <MessageSquare size={14} />
          Perguntar sobre meu espelho
        </button>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-0">
        <motion.p
          variants={item}
          className="text-2xl font-medium mb-8 leading-relaxed"
          style={{ color: 'var(--foreground)' }}
        >
          {mirror.intro}
        </motion.p>

        <MirrorSection
          label={t('sections.primaryStrength')}
          headline={mirror.primary_strength.headline}
          evidence={mirror.primary_strength.evidence}
          primary
        />

        <MirrorSection
          label={t('sections.invisibleSkill')}
          headline={mirror.invisible_skill.headline}
          evidence={mirror.invisible_skill.evidence}
          warm
        />

        <MirrorSection
          label={t('sections.contextPattern')}
          headline={mirror.context_pattern.headline}
          evidence={mirror.context_pattern.evidence}
        />

        <motion.p
          variants={item}
          className="py-8 text-lg italic text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          {mirror.closing}
        </motion.p>

        {mirror.strength_themes.length > 0 && (
          <motion.div variants={item} className="pb-8">
            <SectionLabel>{t('themes')}</SectionLabel>
            {/* Tags de leitura — só os temas, sem ação por item nem CTA de bio. A ação ("usar" um
                tema, gerar bio) vive no destino Usar; aqui o Espelho é contemplação, não launchpad. */}
            <div className="flex flex-wrap gap-2">
              {mirror.strength_themes.map((theme) => (
                <span
                  key={theme}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {mirror.categories && mirror.categories.length > 0 && (
          <motion.div variants={item}>
            <MacroCategoryTabs categories={mirror.categories} />
          </motion.div>
        )}

        <motion.div variants={item} className="pt-6 space-y-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <MirrorFeedback snapshotId={snapshot.id} initialResonated={snapshot.resonated} />

          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => void handleRegenerate()}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              {loading ? t('regenerating') : t('regenerate')}
            </button>
            {!loading && !regenerateError && !aiLimit && (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Usa suas entradas mais recentes
              </p>
            )}
            {aiLimit && (
              <div className="w-full pt-1">
                <AiLimitNotice info={aiLimit} onDismiss={() => setAiLimit(null)} />
              </div>
            )}
            {regenerateError && (
              <p className="text-xs font-medium" style={{ color: 'var(--destructive)' }}>
                {regenerateError}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
