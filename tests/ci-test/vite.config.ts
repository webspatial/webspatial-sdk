import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Consumer-shaped config: resolve `@webspatial/*` through workspace
// package exports (built `dist/`), not monorepo source aliases. Aliasing
// SDK source + applying the WebSpatial JSX transform to those files
// re-enters the SDK's own jsx-runtime through pre-compiled component
// modules and produces Rollup circular-chunk warnings at build time.
//
// JSX runtime resolution: `tsconfig.app.json` sets
// `"jsxImportSource": "@webspatial/react-sdk"`, so only this fixture's
// app/spec TSX is compiled through the published jsx-runtime subpath.
export default defineConfig({
  server: {
    port: 4000,
    open: false,
  },

  plugins: [
    react({
      // SDK dist is already compiled JS; never re-run the spatial JSX
      // transform over workspace package files.
      exclude: /node_modules\/@webspatial\//,
    }),
  ],

  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
