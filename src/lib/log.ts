type LogMeta = Record<string, string | number | boolean | null | undefined>

function write(level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta): void {
  const entry = { level, message, ...(meta ?? {}) }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
    return
  }
  if (level === 'warn') {
    console.warn(JSON.stringify(entry))
    return
  }
  console.info(JSON.stringify(entry))
}

/**
 * Logger mínimo. NUNCA passar dados de usuário (conteúdo de captura, e-mail, nome, etc.)
 * em `meta` — apenas identificadores opacos e contexto técnico.
 */
export const logger = {
  info: (message: string, meta?: LogMeta) => write('info', message, meta),
  warn: (message: string, meta?: LogMeta) => write('warn', message, meta),
  error: (message: string, meta?: LogMeta) => write('error', message, meta),
}
