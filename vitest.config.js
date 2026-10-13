/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      include: ['src/**/*.js'],
      exclude: [
        'src/**/*.test.js',
        'src/main.js',
        // Playwright specs run under `npm run test:e2e`, never vitest.
        'src/tests/**',
      ],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});