import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { version } from './package.json'

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
  // tsup replaces `__WEBSPATIAL_REACT_SDK_VERSION__` at build time via its
  // `esbuildOptions.define`. Vitest doesn't run through tsup, so tests that
  // import `src/index.ts` (which references the constant) need an equivalent
  // global injection here.
  define: {
    __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    exclude: ['dist/**', 'node_modules/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
