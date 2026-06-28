import { defineConfig, configDefaults } from 'vitest/config'
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
    // Não varrer worktrees irmãs montadas em .claude/worktrees (cada branch tem seus
    // próprios testes; rodá-los a partir da branch principal gera falsos vermelhos).
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
})
