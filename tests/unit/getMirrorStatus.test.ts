import { describe, it, expect } from 'vitest'
import { getMirrorStatus, STATUS_CONFIG } from '@/lib/panel/getMirrorStatus'

describe('getMirrorStatus', () => {
  it('returns building for 0 entries', () => {
    expect(getMirrorStatus(0)).toBe('building')
  })

  it('returns building for 3 entries (upper edge)', () => {
    expect(getMirrorStatus(3)).toBe('building')
  })

  it('returns emerging for 4 entries (lower edge)', () => {
    expect(getMirrorStatus(4)).toBe('emerging')
  })

  it('returns emerging for 9 entries (upper edge)', () => {
    expect(getMirrorStatus(9)).toBe('emerging')
  })

  it('returns active for 10 entries (lower edge)', () => {
    expect(getMirrorStatus(10)).toBe('active')
  })

  it('returns active for entry counts well above the threshold', () => {
    expect(getMirrorStatus(57)).toBe('active')
  })
})

describe('STATUS_CONFIG', () => {
  it('provides a dot color and label for every status', () => {
    expect(STATUS_CONFIG.building).toEqual({ dot: 'bg-orange-500', label: 'Em construção' })
    expect(STATUS_CONFIG.emerging).toEqual({ dot: 'bg-amber-500', label: 'Tomando forma' })
    expect(STATUS_CONFIG.active).toEqual({ dot: 'bg-green-500', label: 'Ativo' })
  })
})
