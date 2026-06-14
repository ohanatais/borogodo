/**
 * Fixture #2 — PM de plataforma/escala (exemplo-ouro #2, sintético, fintech BR)
 * Perfil: plataforma técnica, confiabilidade, cliente interno, mercado regulado BACEN.
 */
export const fixture2Entries = [
  {
    what_i_did:
      'Tornei-me dona da API interna de pagamentos consumida por 14 squads de produto',
    company: 'Fintech BR',
    role_title: 'Senior PM',
    role_start: '2021-01-01',
    role_end: null,
    impact: 'Plataforma que serve 14 squads simultaneamente',
    metric: null,
    tags: ['plataforma', 'API', 'produto interno'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Lancei SDK interno e contrato de API versionado para facilitar integração de novos métodos de pagamento',
    company: 'Fintech BR',
    role_title: 'Senior PM',
    role_start: '2021-01-01',
    role_end: null,
    impact: 'Integrar um novo método de pagamento caiu de 6 semanas para 5 dias',
    metric: 'lead time de integração: 6 semanas → 5 dias',
    tags: ['plataforma', 'SDK', 'developer experience'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Defini SLAs e roadmap de confiabilidade do core de pagamentos',
    company: 'Fintech BR',
    role_title: 'Senior PM',
    role_start: '2021-01-01',
    role_end: null,
    impact: 'Uptime do core melhorado',
    metric: 'uptime 99,2% → 99,95%',
    tags: ['confiabilidade', 'SLA', 'infraestrutura como produto'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Liderei migração de gateway legado processando ~R$ 4 bi/mês sem downtime',
    company: 'Fintech BR',
    role_title: 'Senior PM',
    role_start: '2021-01-01',
    role_end: null,
    impact: 'Migração concluída sem interrupção de serviço',
    metric: 'R$ 4 bi/mês processados sem downtime',
    tags: ['migração', 'confiabilidade', 'pagamentos'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Fui dona do onboarding regulado BACEN e mediou priorização entre Compliance, Risco e Growth',
    company: 'Fintech BR',
    role_title: 'PM de Identidade/KYC',
    role_start: '2019-01-01',
    role_end: '2021-01-01',
    impact: 'Redução do drop no onboarding sem furar conformidade regulatória',
    metric: '-22% drop no onboarding',
    tags: ['KYC', 'BACEN', 'regulado', 'stakeholders', 'compliance'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Atuei como PM de Aquisição e depois como PM em e-commerce, trabalhando com checkout e antifraude',
    company: 'E-commerce BR',
    role_title: 'Product Manager',
    role_start: '2016-01-01',
    role_end: '2019-01-01',
    impact: null,
    metric: null,
    tags: ['antifraude', 'checkout', 'growth'],
    source: 'text' as const,
  },
]

export const fixture2UserName = 'Camila'
