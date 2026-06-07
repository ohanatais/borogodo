import type { Entry } from '@/types/entry'

export type CaptureInput =
  | { kind: 'text'; content: string }
  | { kind: 'audio'; blob: Blob }     // costura (501 no MVP)
  | { kind: 'image'; file: File }     // costura (501 no MVP)
  | { kind: 'file'; file: File }

export type ReflectionMoveType = 'question' | 'affirmation' | 'suggestion'

export interface ReflectionMove {
  type: ReflectionMoveType
  text: string
  field?: 'metric' | 'impact' | 'decision' | 'learning'
}

export interface Reflection {
  summary: string
  pills: string[]
  move: ReflectionMove
}

export interface CaptureContext {
  strengthThemes: string[]
  recentSummaries: string[]
  entryCount: number
}

export interface CaptureResult {
  entries: Entry[]
  reflection: Reflection
}
