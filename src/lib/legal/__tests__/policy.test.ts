import { describe, it, expect } from 'vitest'
import { CURRENT_TERMS_VERSION, LEGAL_ROUTES, needsTermsAcceptance } from '../policy'

describe('needsTermsAcceptance', () => {
  it('returns true when the account never accepted (null)', () => {
    expect(needsTermsAcceptance(null)).toBe(true)
  })

  it('returns true when the accepted version is outdated', () => {
    expect(needsTermsAcceptance('versão-antiga')).toBe(true)
  })

  it('returns false when the accepted version matches the current one', () => {
    expect(needsTermsAcceptance(CURRENT_TERMS_VERSION)).toBe(false)
  })
})

describe('LEGAL_ROUTES', () => {
  it('points to the dedicated legal pages', () => {
    expect(LEGAL_ROUTES.terms).toBe('/termos-de-uso')
    expect(LEGAL_ROUTES.privacy).toBe('/politica-de-privacidade')
  })
})
