// tsup.config.ts
import { defineConfig, Options } from 'tsup'

const baseConfig: Options = {
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
    noExternal: ['@webspatial/core-sdk'],
    esbuildOptions(options) {
      options.alias = {
        '@webspatial/core-sdk': './src/noRuntime.ts',
      }
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
    entry: [
      'src/jsx/jsx-dev-runtime.ts',
      'src/jsx/jsx-dev-runtime.react-server.ts',
      'src/jsx/jsx-runtime.ts',
      'src/jsx/jsx-runtime.react-server.ts',
    ],
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
