import type { ReactNode } from 'react'

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function plainAiText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*-{2,}\s*$/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function splitAiTextTitle(text: string): { title: string | null; body: string } {
  const lines = text.split('\n')
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0)
  if (firstContentIndex < 0) return { title: null, body: '' }

  const firstLine = lines[firstContentIndex].trim()
  const heading = firstLine.match(/^#{1,6}\s+(.+)$/)
  const boldHeading = firstLine.match(/^\*\*([^*]+)\*\*$/)
  const title = heading?.[1] ?? boldHeading?.[1] ?? null

  if (!title) return { title: null, body: text }
  return {
    title: plainAiText(title),
    body: lines.filter((_, index) => index !== firstContentIndex).join('\n').trim(),
  }
}

export function FormattedAiText({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {content.split('\n').map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed || /^-{2,}$/.test(trimmed)) return null

        const heading = trimmed.match(/^#{1,6}\s+(.+)$/)
        if (heading) {
          return <p key={index} className="pt-1 text-base font-semibold leading-snug">{renderInlineMarkdown(heading[1])}</p>
        }

        const orderedItem = trimmed.match(/^(\d+)\.\s+(.+)$/)
        if (orderedItem) {
          return (
            <div key={index} className="flex gap-2.5">
              <span className="shrink-0 font-semibold" style={{ color: 'var(--color-primary)' }}>{orderedItem[1]}.</span>
              <p className="min-w-0">{renderInlineMarkdown(orderedItem[2])}</p>
            </div>
          )
        }

        return <p key={index}>{renderInlineMarkdown(trimmed)}</p>
      })}
    </div>
  )
}
