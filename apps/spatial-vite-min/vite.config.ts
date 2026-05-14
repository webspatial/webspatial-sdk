import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Lazy-load v1 deliberately removes the need for `@webspatial/vite-plugin`:
// the SDK's runtime detection + facade pattern replaces what the plugin
// used to do at build time. This config is intentionally minimal — it
// only wires up React's Fast Refresh and JSX transform; everything else
// is the framework default.
//
// JSX runtime resolution: `tsconfig.json` sets
// `"jsxImportSource": "@webspatial/react-sdk"`, so both tsc and
// `@vitejs/plugin-react` (which honors tsconfig) resolve <div enable-xr>
// through the SDK's jsx-runtime that strips the marker and wraps the
// host element with `withSpatialized2DElementContainer`.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        eager: path.resolve(__dirname, 'eager.html'),
        eagerLean: path.resolve(__dirname, 'eager-lean.html'),
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle React + ReactDOM so dev mode doesn't waterfall; the SDK
    // is left out so Vite re-resolves it through workspace symlinks on
    // every change to `packages/react/dist/`.
    include: ['react', 'react-dom'],
  },
})
