'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

export function ReadingState() {
  const t = useTranslations('capture')

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="text-base font-medium text-center"
      style={{ color: 'var(--muted-foreground)' }}
    >
      {t('reading')}
    </motion.p>
  )
}
