import { describe, it, expect } from 'vitest'
import { CAPTURE_SYSTEM_PROMPT, buildCaptureUserPrompt } from '@/lib/ai/extraction/prompts/capture'

const context = {
  strengthThemes: ['liderança técnica', 'comunicação'],
  recentSummaries: ['Liderou migração do banco', 'Mentorou júnior em onboarding'],
  entryCount: 7,
}

describe('CAPTURE_SYSTEM_PROMPT', () => {
  it('é uma string estável (não depende de dados de usuário) — preserva prompt caching', () => {
    expect(typeof CAPTURE_SYSTEM_PROMPT).toBe('string')
    expect(CAPTURE_SYSTEM_PROMPT.length).toBeGreaterThan(0)
    expect(CAPTURE_SYSTEM_PROMPT).not.toContain('liderança técnica')
  })

  it('instrui a saída em bloco ```json e preserva a voz da pessoa', () => {
    expect(CAPTURE_SYSTEM_PROMPT).toContain('```json')
    expect(CAPTURE_SYSTEM_PROMPT.toLowerCase()).toContain('voz')
  })
})

describe('buildCaptureUserPrompt', () => {
  it('injeta o contexto do próprio usuário no prompt', () => {
    const prompt = buildCaptureUserPrompt('fechei a migração no prazo', 'text', context)

    expect(prompt).toContain('liderança técnica')
    expect(prompt).toContain('Liderou migração do banco')
    expect(prompt).toContain('7')
    expect(prompt).toContain('fechei a migração no prazo')
  })

  it('não injeta contexto de outro usuário — cada chamada recebe só o seu próprio context', () => {
    const otherContext = { strengthThemes: ['design'], recentSummaries: ['Refez onboarding'], entryCount: 2 }

    const promptA = buildCaptureUserPrompt('texto A', 'text', context)
    const promptB = buildCaptureUserPrompt('texto B', 'text', otherContext)

    expect(promptA).not.toContain('design')
    expect(promptB).not.toContain('liderança técnica')
  })

  it('lida com contexto vazio (usuário sem entradas/espelho)', () => {
    const prompt = buildCaptureUserPrompt('primeira captura', 'text', {
      strengthThemes: [],
      recentSummaries: [],
      entryCount: 0,
    })

    expect(prompt).toContain('nenhuma')
  })

  it('trunca o input em ~8000 caracteres', () => {
    const longText = 'a'.repeat(9000)

    const prompt = buildCaptureUserPrompt(longText, 'text', context)

    expect(prompt.length).toBeLessThan(longText.length + 500)
  })
})
