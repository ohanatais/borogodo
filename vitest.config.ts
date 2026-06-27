import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    // Worktrees efêmeras de agentes vivem em .claude/worktrees com cópias do código; não são
    // alvo de teste do repo principal (o alias `@` aponta só pra ./src). Sem excluí-las, o vitest
    // roda testes duplicados/desatualizados dessas pastas.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/worktrees/**'],
  },
})
