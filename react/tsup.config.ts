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
    format: ['cjs', 'esm'],
    outDir: 'dist/web',
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.js',
    }),
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
    format: ['cjs', 'esm'],
    outDir: 'dist/default',
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.js',
    }),
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
    entry: ['src/jsx/jsx-dev-runtime.ts', 'src/jsx/jsx-runtime.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist/jsx',
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.js',
    }),
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        __WEB__: 'false',
      }
    },
  },
])
