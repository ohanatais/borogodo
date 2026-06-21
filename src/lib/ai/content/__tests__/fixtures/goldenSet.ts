import type { DraftFormat, LengthPref, VoiceProfile } from '@/types/content'

// Golden set (T015): casos reais (seed + voice_profile + saída mockada) que travam regressão de voz
// quando qualquer prompt do bloco mudar (013/014/015). Sem custo de IA: as asserções rodam sobre o
// ruleset determinístico e sobre os rótulos do seed.

const TS = '2026-06-15T12:00:00.000Z'

interface GoldenVariant {
  angle: string
  body: string
  evidence_refs: string[]
}

export interface GoldenCase {
  name: string
  format: DraftFormat
  /** Rótulos de evidência disponíveis no seed; evidence_refs do output devem ser um subconjunto. */
  seedLabels: string[]
  voiceProfile: VoiceProfile | null
  output: { variants: GoldenVariant[] }
  lengthPref?: LengthPref
}

export interface BadCase {
  name: string
  assert: number
  body: string
}

export const goodCases: GoldenCase[] = [
  {
    name: 'post — PM 0→1 sênior, com métrica',
    format: 'post',
    seedLabels: ['E1', 'E2', 'E3'],
    voiceProfile: { tone: 'direto e caloroso', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'o aprendizado',
          body: 'Liderei o discovery de um produto do zero numa fintech. Passei as primeiras três semanas ouvindo quem ia usar antes de escrever qualquer roadmap. Quando a engenharia entrou, a gente já sabia o que cortar.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'o número que mudou',
          body: 'No primeiro ano, levamos a ativação de 22% para 38% em quatro trimestres, ajustando o onboarding a cada ciclo. O mérito foi de ouvir os primeiros clientes de perto, não de um palpite meu.',
          evidence_refs: ['E2', 'E3'],
        },
      ],
    },
  },
  {
    name: 'post — APM júnior, sem métrica',
    format: 'post',
    seedLabels: ['E1', 'E2'],
    voiceProfile: null,
    output: {
      variants: [
        {
          angle: 'de onde eu venho',
          body: 'Antes de virar APM, passei dois anos no suporte atendendo pequenas empresas. Aprendi a ouvir o problema real por trás do chamado, e isso virou a base de conhecimento que o time usa até hoje.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'o que mudou no meu trabalho',
          body: 'Hoje levanto requisito com negócio, design e engenharia. Como já trabalhei na ponta com o cliente, consigo traduzir a dor de quem usa para quem constrói, sem perder o contexto no caminho.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'post — engenheiro de dados, com métrica',
    format: 'post',
    seedLabels: ['E1', 'E2'],
    voiceProfile: { tone: 'técnico e seco', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'o problema que ninguém via',
          body: 'A gente perdia horas toda semana refazendo relatório na mão. Montei um pipeline que junta as fontes e atualiza sozinho, e o time recuperou um dia inteiro de trabalho por semana.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'como foi feito',
          body: 'Comecei pequeno, com uma tabela só, e fui expandindo conforme o time confiava no dado. Em dois meses, a maior parte dos relatórios já rodava sem ninguém tocar.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'post — designer, sem métrica',
    format: 'post',
    seedLabels: ['E1'],
    voiceProfile: null,
    output: {
      variants: [
        {
          angle: 'a decisão difícil',
          body: 'Refiz o fluxo de cadastro três vezes até parar de atrapalhar quem estava com pressa. A versão final ficou bem enxuta, porque tirei o que ninguém usava.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'quem ajudou',
          body: 'Sentei com o time de suporte para entender onde as pessoas travavam. Foram eles que apontaram o passo que confundia todo mundo, e a correção veio daí.',
          evidence_refs: ['E1'],
        },
      ],
    },
  },
  {
    name: 'post — transição CS para produto, sem métrica',
    format: 'post',
    seedLabels: ['E1', 'E2'],
    voiceProfile: { samples: ['Gosto de escrever curto, com exemplo concreto e sem enrolar.'], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'a virada',
          body: 'Comecei no atendimento e fui chegando perto de produto sem perceber. Documentava cada problema recorrente e propunha solução, até que um dia o time me chamou pra fazer isso em tempo integral.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'o que trouxe comigo',
          body: 'Trouxe do suporte o costume de ouvir antes de opinar. Quando entro numa discussão de roadmap, começo pelo que o cliente reclamou na semana, com nome e situação.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'resumo de impacto — PM sênior, com métrica',
    format: 'impact_summary',
    seedLabels: ['E1', 'E2'],
    voiceProfile: { tone: 'objetivo', lengthPref: 'medio', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'pra review',
          body: 'Liderei o lançamento do app de pagamentos do discovery ao pós-lançamento. Reduzi o tempo de resposta da API de 800 para 200 milissegundos no primeiro trimestre, trabalhando junto com a engenharia.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'pra promoção',
          body: 'Assumi a função de produto numa área que não tinha PM e estruturei o processo de discovery do zero. Em um ano, entreguei três releases grandes com a engenharia e o time comercial.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'resumo de impacto — júnior, sem métrica',
    format: 'impact_summary',
    seedLabels: ['E1', 'E2'],
    voiceProfile: null,
    output: {
      variants: [
        {
          angle: 'pra entrevista',
          body: 'Apoiei o discovery e o refinamento de backlog num SaaS B2B. Documentei os problemas recorrentes do suporte e montei a base de conhecimento que o time passou a usar no dia a dia.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'pra recrutador',
          body: 'Levantei requisito com negócio, design e engenharia, e antes treinei os atendentes novos no período de crescimento do time. Já circulei pelas três pontas do produto.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'resumo de impacto — marketing, com crescimento',
    format: 'impact_summary',
    seedLabels: ['E1'],
    voiceProfile: { tone: 'caloroso', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'pra review',
          body: 'Reformulei a estratégia de conteúdo do blog e a base de leads cresceu de forma constante ao longo de seis meses. Escrevi a maior parte dos artigos e ajustei o tema conforme a busca trazia gente nova.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'pra entrevista',
          body: 'Toquei o conteúdo sozinha por um ano, da pauta à publicação. Aprendi a escrever para quem busca solução, sem assumir que a pessoa já conhece a marca.',
          evidence_refs: ['E1'],
        },
      ],
    },
  },
  {
    name: 'resumo de impacto — vendas sênior, com previsibilidade',
    format: 'impact_summary',
    seedLabels: ['E1', 'E2'],
    voiceProfile: { lengthPref: 'medio', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'pra review',
          body: 'Assumi uma carteira parada e recuperei contas que estavam sem contato havia meses. Bati a meta do trimestre falando com cada cliente sobre o uso real, sem empurrar contrato.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'pra promoção',
          body: 'Estruturei o processo de prospecção que o time não tinha. Em dois trimestres, passamos a ter previsibilidade no funil, com etapa clara e dado em cada passo.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'resumo de impacto — gestão de pessoas, curto, sem métrica',
    format: 'impact_summary',
    seedLabels: ['E1'],
    voiceProfile: { lengthPref: 'curto', samples: [], updatedAt: TS },
    lengthPref: 'curto',
    output: {
      variants: [
        {
          angle: 'pra review',
          body: 'Montei o programa de integração de novos contratados do zero. Cada pessoa entra com um plano claro das primeiras semanas.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'pra entrevista',
          body: 'Cuidei do onboarding semana a semana e os novatos passaram a entregar mais cedo, com menos retrabalho.',
          evidence_refs: ['E1'],
        },
      ],
    },
  },
  {
    name: 'mini-bio — PM sênior, factual, sem clichê',
    format: 'mini_bio',
    seedLabels: ['E1', 'E2'],
    voiceProfile: { tone: 'direto e caloroso', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'mais direta',
          body: 'Sou PM há oito anos, hoje lidero produto numa fintech. Já construí times de discovery do zero e levei dois produtos de ideia a lançamento.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'mais narrativa',
          body: 'Comecei em dados e migrei para produto quando vi que gostava mais de decidir o que construir. Hoje cuido da área de pagamentos de uma fintech.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'mini-bio — designer, transição de carreira',
    format: 'mini_bio',
    seedLabels: ['E1'],
    voiceProfile: null,
    output: {
      variants: [
        {
          angle: 'pra topo de perfil',
          body: 'Designer de produto há cinco anos. Trabalho com pesquisa e interface, e gosto de simplificar fluxo que cresceu demais.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'pra assinatura',
          body: 'Entrei em design vindo da arquitetura. Hoje desenho produtos digitais, com foco em quem usa todo dia e não tem tempo a perder.',
          evidence_refs: [],
        },
      ],
    },
  },
  {
    name: 'mini-bio — engenheiro de dados, técnico e seco, curta',
    format: 'mini_bio',
    seedLabels: ['E1', 'E2'],
    voiceProfile: { tone: 'técnico e seco', lengthPref: 'curto', samples: [], updatedAt: TS },
    lengthPref: 'curto',
    output: {
      variants: [
        {
          angle: 'pra topo de perfil',
          body: 'Engenheiro de dados. Monto pipelines e cuido da base que o time de produto usa para decidir.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'pra assinatura',
          body: 'Trabalho com dados desde a faculdade. Hoje cuido da infraestrutura de dados de uma empresa de logística, do ETL ao painel.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
  {
    name: 'post opinião (018 US2) — tese ancorada no lastro',
    format: 'post',
    seedLabels: ['Lastro', 'E1'],
    voiceProfile: { tone: 'direto e caloroso', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'a tese',
          body: 'Retenção se constrói com confiança, não com promoção. Conduzi a virada de retenção numa fintech ajustando o onboarding a cada ciclo, e a recompra subiu de forma constante ao longo de quatro trimestres.',
          evidence_refs: ['Lastro'],
        },
        {
          angle: 'o contraponto',
          body: 'Muito time mede engajamento e esquece a confiança acumulada. Quando parei de caçar usuário novo e cuidei de quem já estava na base, a conversa com o cliente mudou de tom no primeiro mês.',
          evidence_refs: ['E1'],
        },
      ],
    },
  },
  {
    name: 'post estudo (018 US1) — aprendizado ancorado',
    format: 'post',
    seedLabels: ['E1', 'E2'],
    voiceProfile: { tone: 'direto e caloroso', samples: [], updatedAt: TS },
    output: {
      variants: [
        {
          angle: 'o que estudei',
          body: 'Estudei análise de cohort do zero enquanto liderava o discovery de um produto numa fintech. Levei umas semanas pra entender por que retenção contava mais que aquisição no nosso caso.',
          evidence_refs: ['E1'],
        },
        {
          angle: 'a mudança de perspectiva',
          body: 'Aprendi a olhar retenção como confiança acumulada ao longo dos trimestres, ajustando o onboarding a cada ciclo em vez de caçar usuário novo.',
          evidence_refs: ['E2'],
        },
      ],
    },
  },
]

export const badCases: BadCase[] = [
  { name: 'travessão', assert: 1, body: 'Entreguei o projeto — no prazo combinado.' },
  { name: 'buzzword (data-driven, proativo)', assert: 2, body: 'Sou um PM data-driven e bem proativo.' },
  { name: 'antítese (não é X, é Y)', assert: 3, body: 'Isso não é sorte, é método no dia a dia.' },
  { name: 'advérbio de ênfase vazio', assert: 4, body: 'Foi simplesmente o melhor lançamento do ano.' },
  { name: 'jargão de IA (mover a agulha)', assert: 5, body: 'Precisávamos mover a agulha do negócio.' },
  { name: 'jargão de LinkedIn (comente abaixo)', assert: 6, body: 'Curtiu? Comente abaixo o que achou.' },
  { name: 'número sem janela de tempo', assert: 7, body: 'Subi a meta de 20 para 45.' },
  { name: 'gíria de elogio (mandou bem)', assert: 8, body: 'Você mandou bem demais nesse projeto.' },
  { name: 'brasilidade boba (jeitinho)', assert: 9, body: 'Resolvi tudo no jeitinho de sempre.' },
  { name: 'clichê de bio (apaixonado por tecnologia)', assert: 10, body: 'Profissional apaixonado por tecnologia e movido a desafios.' },
  { name: 'hot take', assert: 11, body: 'Isso é um hot take que vai incomodar muito gente.' },
  { name: 'impopular mas', assert: 11, body: 'Opinião impopular mas alguém tinha que falar sobre isso.' },
  { name: 'ninguém fala sobre isso', assert: 11, body: 'Ninguém fala sobre isso mas é a verdade do mercado.' },
  { name: 'opinião sem âncora (hot take de polêmica vazia)', assert: 11, body: 'Vou dar um hot take aqui: a maioria está errada e ninguém tem coragem de dizer.' },
]
