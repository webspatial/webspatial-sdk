import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@webspatial/core-sdk': fileURLToPath(
        new URL('../core/src/index.ts', import.meta.url),
      ),
      '@webspatial/react-sdk': fileURLToPath(
        new URL('./src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['dist/**', 'node_modules/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
