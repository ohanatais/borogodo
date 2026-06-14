/**
 * Fixture #1 — PM de 0→1 em consultoria (exemplo-ouro #1, persona Ana)
 * Perfil: métrica rica, multi-país, 0→1 em 3 casas, fluência técnica emergente.
 */
export const fixture1Entries = [
  {
    what_i_did:
      'Liderei 9 produtos cliente de 0→1, do primeiro discovery ao pós-launch, em EUA, Nova Zelândia e Brasil',
    company: 'Cheesecake Labs',
    role_title: 'Product Manager',
    role_start: '2024-01-01',
    role_end: null,
    impact: '9 produtos entregues cross-país em AgTech, HealthTech, ferramentas de IA e B2B2C',
    metric: null,
    tags: ['0→1', 'consultoria', 'enterprise', 'discovery'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Conduzi 4 ciclos de Discovery e 6 de Development em contextos que eu não conhecia antes de entrar',
    company: 'Cheesecake Labs',
    role_title: 'Product Manager',
    role_start: '2024-01-01',
    role_end: null,
    impact: 'Entrega em AgTech, HealthTech, ferramentas de IA, B2B2C',
    metric: null,
    tags: ['discovery', 'delivery', '0→1'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Facilituei user research, workshops de jornada e entrevistas com stakeholders em squads multi-fuso',
    company: 'Cheesecake Labs',
    role_title: 'Product Manager',
    role_start: '2024-01-01',
    role_end: null,
    impact: 'Dois reviews 5★ no Clutch mantendo CSAT em squads com Eng, Design e DevOps',
    metric: '5★ Clutch',
    tags: ['stakeholders', 'research', 'CSAT'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Implementei workflows de IA com Claude Code e MCPs para acelerar investigação técnica e documentação',
    company: 'Cheesecake Labs',
    role_title: 'Product Manager',
    role_start: '2024-01-01',
    role_end: null,
    impact: 'Redução de 70% no tempo de investigação técnica e documentação',
    metric: '-70% tempo de investigação',
    tags: ['IA', 'AI-native', 'fluência técnica'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Geri budget, staffing e entrega cross-functional para clientes em 3 mercados simultaneamente',
    company: 'Cheesecake Labs',
    role_title: 'Product Manager',
    role_start: '2024-01-01',
    role_end: null,
    impact: null,
    metric: null,
    tags: ['delivery', 'cross-functional', 'enterprise'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Identifiquei oportunidade de receita recorrente e construí ecossistema white-label B2B2C a partir de um único cliente',
    company: 'Vibe Tecnologia',
    role_title: 'Product Manager',
    role_start: '2022-01-01',
    role_end: '2024-01-01',
    impact: 'Hoje adotado por grandes seguradoras brasileiras',
    metric: null,
    tags: ['0→1', 'B2B2C', 'mercado regulado', 'planos de saúde'],
    source: 'text' as const,
  },
  {
    what_i_did: 'Defini visão e roadmap de 5+ produtos em mercado regulado de planos de saúde',
    company: 'Vibe Tecnologia',
    role_title: 'Product Manager',
    role_start: '2022-01-01',
    role_end: '2024-01-01',
    impact: '200+ clientes B2B atendidos',
    metric: null,
    tags: ['roadmap', 'visão', 'mercado regulado'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Cortei tempo de investigação de desenvolvimento analisando API, log e NoSQL direto no Postman',
    company: 'Vibe Tecnologia',
    role_title: 'Product Manager',
    role_start: '2022-01-01',
    role_end: '2024-01-01',
    impact: 'Resolvi 30% dos tickets de suporte na raiz técnica',
    metric: '-50% tempo de investigação dev, 30% tickets resolvidos na raiz',
    tags: ['fluência técnica', 'API', 'debugging'],
    source: 'text' as const,
  },
  {
    what_i_did:
      'Montei a função de produto do zero como primeira contratação: discovery, priorização, AC e QA',
    company: 'Gestão DS',
    role_title: 'Product Owner',
    role_start: '2021-01-01',
    role_end: '2022-01-01',
    impact: '5+ módulos para clínicas entregues; ARR cresceu para $400K+',
    metric: 'ARR $400K+ em 2021',
    tags: ['0→1', '1ª contratação', 'HealthTech', 'função de produto do zero'],
    source: 'text' as const,
  },
  {
    what_i_did: 'Atuei como Scrum Master, de estagiária a SM em 3 meses, melhorando o throughput do time',
    company: 'Gestão DS',
    role_title: 'Scrum Master',
    role_start: '2020-01-01',
    role_end: '2021-01-01',
    impact: 'Aumento de throughput do time',
    metric: '+30% throughput',
    tags: ['delivery', 'liderança', 'agile'],
    source: 'text' as const,
  },
]

export const fixture1UserName = 'Ana'
