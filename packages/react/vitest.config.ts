import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
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
  resolve: {
    alias: [
      // `src/jsx/jsx-shared.ts` imports the facade trio via the external
      // package self-reference `@webspatial/react-sdk/internal/facades-client`
      // so tsup leaves that import literal in the published `dist/` output
      // (used by RSC bundlers to detect the `'use client'` boundary).
      // Vitest doesn't run through tsup; without an alias the import would
      // attempt to resolve from `node_modules`, miss the unbuilt subpath,
      // and break unit tests. Routing the same specifier to the source file
      // preserves module-instance identity across the SDK + the test harness,
      // so `expect(result).toBe(withSpatialized2DElementContainer('div'))`
      // continues to compare against the SAME function reference.
      {
        find: '@webspatial/react-sdk/internal/facades-client',
        replacement: resolve(__dirname, 'src/internal/facades-client.ts'),
      },
      {
        find: '@webspatial/core-sdk/runtime',
        replacement: resolve(__dirname, '../core/src/runtime/index.ts'),
      },
      {
        find: '@webspatial/core-sdk/install-polyfills',
        replacement: resolve(__dirname, '../core/src/install-polyfills.ts'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    exclude: ['dist/**', 'node_modules/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
