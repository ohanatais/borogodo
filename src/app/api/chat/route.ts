import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { answerCareerQuestion, type ChatMessage, type ChatContext } from '@/lib/ai/chat/answerCareerQuestion'
import { logger } from '@/lib/log'
import { z } from 'zod'

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .optional(),
  context: z
    .object({
      type: z.enum(['espelho', 'historico', 'empresa', 'entry']),
      entityId: z.string().optional(),
    })
    .optional(),
})

function sseChunk(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(request: Request): Promise<Response> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const { message, history = [], context } = parsed.data

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await answerCareerQuestion(
          supabase,
          user.id,
          message,
          history as ChatMessage[],
          context as ChatContext | undefined,
          {
            onDelta: (text) => {
              controller.enqueue(sseChunk({ type: 'delta', text }))
            },
            onDone: (citations, suggestions) => {
              controller.enqueue(sseChunk({ type: 'done', citations, suggestions }))
              controller.close()
            },
            onError: (msg) => {
              logger.error('chat stream error', { message: msg })
              controller.enqueue(sseChunk({ type: 'error', message: 'Não consegui responder agora. Tenta de novo?' }))
              controller.close()
            },
          }
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        logger.error('chat route error', { message })
        controller.enqueue(sseChunk({ type: 'error', message: 'Não consegui responder agora. Tenta de novo?' }))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
