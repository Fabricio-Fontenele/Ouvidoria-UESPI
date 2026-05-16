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
    include: ['test/unit/**/*.spec.ts', 'test/unit/**/*.test.ts'],
    exclude: ['build/**', 'coverage/**', 'node_modules/**', 'test/e2e/**'],
    coverage: {
      provider: 'v8',
      enabled: false,
      reportsDirectory: './coverage',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/main.ts'],
      thresholds: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
})
