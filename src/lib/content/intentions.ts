// Fonte única da camada "Usar" (Repertório, 017): os dois hubs por intenção e os momentos de
// preparação. É só reorganização — não há motor novo. O "momento" não é formato nem coluna: vira
// o `angle` enviado ao motor `impact_summary` existente e um rótulo livre em `drafts.qa.moment`.
// Reusado por UI (launchpad, tela de momento), geração e starters do chat. Identificadores em
// inglês (constituição II); a cópia visível mora no i18n (namespace `repertorio`).

/** Intenção de alto nível: mostrar valor em público vs. se preparar pra um momento privado. */
export type Hub = 'mostrar' | 'preparar'

export const HUBS: readonly Hub[] = ['mostrar', 'preparar']

/** Momento de preparação da v1. */
export type PrepMoment = 'entrevista' | 'review' | 'salario'

/** Ordem de exibição dos momentos no hub PREPARAR. */
export const PREP_MOMENT_ORDER: readonly PrepMoment[] = ['entrevista', 'review', 'salario']

interface PrepMomentConfig {
  /**
   * Enquadramento enviado como `angle` ao motor `impact_summary` — orienta a geração sem ser um
   * novo formato. Também enquadra a conversa quando o caminho é "treinar conversando".
   */
  angleHint: string
  /** 3 frases na voz do usuário, mostradas como pontos de partida da conversa do momento. */
  starters: string[]
}

export const PREP_MOMENTS: Record<PrepMoment, PrepMomentConfig> = {
  entrevista: {
    angleHint:
      'Enquadre como preparação para uma entrevista de emprego. Em primeira pessoa, pronto para a pessoa contar o que fez com naturalidade, mostrando valor sem soar arrogante.',
    starters: [
      'Como falo do meu maior projeto numa entrevista sem soar arrogante?',
      'Que pontos fortes meus valem destacar pra essa vaga?',
      'Me ajuda a responder quando perguntarem sobre um desafio que superei?',
    ],
  },
  review: {
    angleHint:
      'Enquadre para uma conversa de avaliação de desempenho. Destaque impacto e evolução para a pessoa defender o próprio valor com o gestor, com evidências concretas.',
    starters: [
      'Que conquistas eu levo pra minha conversa de avaliação?',
      'Como mostro minha evolução desde a última avaliação?',
      'Me ajuda a defender que mereço uma promoção?',
    ],
  },
  salario: {
    angleHint:
      'Enquadre para embasar um pedido de aumento ou negociação salarial. Evidências concretas do valor entregue, com números quando houver.',
    starters: [
      'Que argumentos eu uso pra pedir um aumento?',
      'Como mostro com números o valor que entreguei?',
      'Me ajuda a preparar a conversa de salário com meu gestor?',
    ],
  },
}

/** Type guard para validar um momento vindo de fora (evento, query, payload). */
export function isPrepMoment(value: string): value is PrepMoment {
  return (PREP_MOMENT_ORDER as readonly string[]).includes(value)
}
