import '@testing-library/jest-dom'
import React from 'react'

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

// jsdom não implementa IntersectionObserver; o Framer Motion usa para `whileInView`.
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

vi.mock('next-intl', () => {
  function useTranslations() {
    const t = ((key: string) => key) as ((key: string) => string) & {
      rich: (
        key: string,
        values?: Record<string, (chunks: React.ReactNode) => React.ReactNode>
      ) => React.ReactNode
    }
    // Mock não tem acesso às mensagens reais; renderiza cada tag com o próprio nome da tag
    // como filho (ex.: <terms>) para que os testes possam achar os links pelo `href`.
    t.rich = (_key, values = {}) =>
      Object.entries(values).map(([tag, render]) =>
        React.createElement(React.Fragment, { key: tag }, render(tag))
      )
    return t
  }
  return { useTranslations }
})

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}))
