import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'test/**/*.spec.ts',
    ],
    exclude: [
      'test/e2e/**/*.spec.ts',
    ],
    coverage: {
      include: [
        'src/**/*.ts',
      ],
    },
    environmentMatchGlobs: [
      // all tests ending with `.dom.spec.ts` will run in jsdom
      ['test/**/*.dom.spec.ts', 'jsdom'],
    ],
  },
})
