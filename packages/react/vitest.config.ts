import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { version } from './package.json'

export default defineConfig({
  plugins: [react()],
  // tsup replaces `__WEBSPATIAL_REACT_SDK_VERSION__` at build time via its
  // `esbuildOptions.define`. Vitest doesn't run through tsup, so tests that
  // import `src/index.ts` (which references the constant) need an equivalent
  // global injection here.
  define: {
    __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(version),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
