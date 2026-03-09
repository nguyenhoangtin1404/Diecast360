import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx,js,jsx}', 'tests/unit/**/*.spec.{ts,tsx,js,jsx}'],
    exclude: ['**/tests/e2e/**', 'node_modules/**'],
  },
});
