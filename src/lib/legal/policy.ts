/**
 * Fonte única de verdade sobre a política legal do Borogodó (feature 024).
 *
 * Consumida pelo aviso sign-in-wrap, o gate de re-consentimento, o Footer e
 * `/configuracoes` — evita divergência de versão/rota entre superfícies.
 */

/** Versão vigente dos termos. Bump aqui dispara re-consentimento (US3, FR-012). */
export const CURRENT_TERMS_VERSION = '2026-07'

export const LEGAL_ROUTES = {
  terms: '/termos-de-uso',
  privacy: '/politica-de-privacidade',
} as const

/** Uma conta precisa (re)aceitar se nunca aceitou ou aceitou versão anterior. */
export function needsTermsAcceptance(termsVersion: string | null): boolean {
  return termsVersion !== CURRENT_TERMS_VERSION
}
