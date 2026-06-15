import type { SkillTier } from '@/types/mirror'

export interface TierStyle {
  cardBg: string
  badgeBg: string
  text: string
  border: string
  hintBg: string
  chipBg: string
  chipText: string
}

export const TIER_STYLE: Record<SkillTier, TierStyle> = {
  Emergente: {
    cardBg: 'oklch(96% 0.04 250)',
    badgeBg: 'oklch(88% 0.10 250)',
    text: 'oklch(28% 0.18 250)',
    border: 'oklch(84% 0.08 250)',
    hintBg: 'oklch(94% 0.05 250)',
    chipBg: 'oklch(86% 0.10 250)',
    chipText: 'oklch(28% 0.18 250)',
  },
  Consistente: {
    cardBg: 'oklch(97% 0.05 80)',
    badgeBg: 'oklch(88% 0.14 80)',
    text: 'oklch(35% 0.15 75)',
    border: 'oklch(84% 0.12 80)',
    hintBg: 'oklch(95% 0.06 80)',
    chipBg: 'oklch(88% 0.12 80)',
    chipText: 'oklch(30% 0.12 75)',
  },
  Comprovada: {
    cardBg: 'oklch(96% 0.05 145)',
    badgeBg: 'oklch(85% 0.14 145)',
    text: 'oklch(28% 0.14 145)',
    border: 'oklch(80% 0.12 145)',
    hintBg: 'oklch(94% 0.06 145)',
    chipBg: 'oklch(85% 0.12 145)',
    chipText: 'oklch(25% 0.12 145)',
  },
}
