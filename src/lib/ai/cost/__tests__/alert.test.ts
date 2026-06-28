import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSnapshot = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/aiUsage', () => ({
  dailyOpsSnapshot: mockSnapshot,
}))

vi.mock('@/lib/ai/cost/limits', () => ({
  getLimits: () => ({ ratePerHour: 10, dailyCapUsd: 10, warnRatio: 0.7 }),
  OPS_ALERT_EMAIL: 'admin@borogodo.ai',
}))

import { composeAlertEmail, sendOpsAlert } from '../alert'
import type { OpsSnapshot } from '@/lib/db/aiUsage'

const SNAPSHOT: OpsSnapshot = {
  totalUsd: 7.2,
  activeUsers: 4,
  ranking: [
    { userId: 'u1', email: 'ana@x.com', costUsd: 5, actions: 12 },
    { userId: 'u2', email: 'bruno@x.com', costUsd: 2.2, actions: 3 },
  ],
  blocked: [{ userId: 'u1', email: 'ana@x.com' }],
}

describe('composeAlertEmail (puro)', () => {
  it('preventivo: assunto com % do teto e corpo com ativos, ranking e gasto', () => {
    const { subject, text } = composeAlertEmail('preventive', SNAPSHOT, 10)
    expect(subject).toContain('72%')
    expect(text).toContain('Usuários ativos hoje: 4')
    expect(text).toContain('ana@x.com')
    expect(text).toContain('US$ 7.20 de US$ 10.00')
    expect(text).not.toContain('seguradas') // preventivo não fala em bloqueio
  })

  it('teto: assunto grita TETO e corpo avisa que gerações estão seguradas e captura segue', () => {
    const { subject, text } = composeAlertEmail('cap_reached', SNAPSHOT, 10)
    expect(subject).toContain('TETO')
    expect(text).toContain('Captura segue liberada')
  })

  it('lista os usuários travados; "(nenhum)" quando não há', () => {
    expect(composeAlertEmail('preventive', SNAPSHOT, 10).text).toContain('- ana@x.com')
    const semTravados: OpsSnapshot = { ...SNAPSHOT, blocked: [] }
    expect(composeAlertEmail('preventive', semTravados, 10).text).toContain('(nenhum)')
  })
})

describe('sendOpsAlert (best-effort)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSnapshot.mockResolvedValue(SNAPSHOT)
  })
  afterEach(() => {
    delete process.env.RESEND_API_KEY
  })

  it('sem RESEND_API_KEY, não busca snapshot nem tenta enviar (não quebra)', async () => {
    delete process.env.RESEND_API_KEY
    await expect(sendOpsAlert('preventive')).resolves.toBeUndefined()
    expect(mockSnapshot).not.toHaveBeenCalled()
  })

  it('se montar o retrato falha, engole o erro (não propaga)', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    mockSnapshot.mockRejectedValue(new Error('db down'))
    await expect(sendOpsAlert('preventive')).resolves.toBeUndefined()
  })
})
