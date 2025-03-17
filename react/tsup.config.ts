// tsup.config.ts
import { defineConfig } from 'tsup'

const baseConfig = {
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
}

export default defineConfig([
  {
    // Web
    ...baseConfig,
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist/web',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        __WEB__: 'true',
      }
    },
  },
  {
    // AVP
    ...baseConfig,
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist/default',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        __WEB__: 'false',
      }
    },
  },

  {
    // JSX
    ...baseConfig,
    external: ['@webspatial/react-sdk'],
    entry: ['src/jsx/jsx-dev-runtime.ts', 'src/jsx/jsx-runtime.ts'],
    format: ['esm'],
    outDir: 'dist/jsx',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        __WEB__: 'false',
      }
    },
  },
])
