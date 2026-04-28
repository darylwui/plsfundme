import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // `tests/e2e/**` is Playwright territory — different runner, different
    // assertion API. Without this exclude Vitest picks up the .spec.ts
    // files and crashes on `@playwright/test` imports.
    exclude: ['**/node_modules/**', '**/.claude/worktrees/**', 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
