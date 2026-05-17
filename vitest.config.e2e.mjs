import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^#src\/(.*)\.js$/,
        replacement: fileURLToPath(new URL('./src/$1.ts', import.meta.url)),
      },
    ],
    conditions: ['development'],
  },
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    include: ['test/e2e/**/*.spec.ts'],
    exclude: ['build/**', 'coverage/**', 'node_modules/**'],
    setupFiles: ['test/e2e/setup-e2e.ts'],
    fileParallelism: true,
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
})
