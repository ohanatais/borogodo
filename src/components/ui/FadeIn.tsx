'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  /** Atraso da entrada, em segundos. Útil pra escalonar elementos do hero. */
  delay?: number
}

/**
 * Entrada com fade + leve subida ao MONTAR (não depende de scroll). Usado no hero, pra
 * haver movimento já na primeira tela. Respeita "reduzir movimento" do sistema.
 */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
