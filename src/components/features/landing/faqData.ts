/**
 * Fonte única das perguntas frequentes da landing (feature 022).
 *
 * A `FaqSection` renderiza a UI a partir desta lista, e o `StructuredData` deriva o
 * `FAQPage` da MESMA lista — garantindo correspondência 1:1 entre o visível e o dado
 * estruturado (SC-004). As chaves apontam para `faq.items.<id>` no i18n.
 */
export interface FaqItem {
  id: string
  questionKey: string
  answerKey: string
}

export const faqItems: readonly FaqItem[] = [
  { id: 'free', questionKey: 'items.free.question', answerKey: 'items.free.answer' },
  { id: 'how', questionKey: 'items.how.question', answerKey: 'items.how.answer' },
  { id: 'robot', questionKey: 'items.robot.question', answerKey: 'items.robot.answer' },
  { id: 'chatgpt', questionKey: 'items.chatgpt.question', answerKey: 'items.chatgpt.answer' },
  { id: 'privacy', questionKey: 'items.privacy.question', answerKey: 'items.privacy.answer' },
  { id: 'effort', questionKey: 'items.effort.question', answerKey: 'items.effort.answer' },
] as const
