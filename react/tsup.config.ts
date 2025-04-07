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
    format: ['cjs'],
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
    format: ['cjs'],
    outDir: 'dist/default',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        __WEB__: 'false',
      }
    },
    // outExtension: f => {
    //   return { js: '.js' }
    // },
  },

  {
    // JSX
    ...baseConfig,
    external: ['@webspatial/react-sdk'],
    entry: [
      // dev
      'src/jsx/jsx-dev-runtime.web.ts',
      'src/jsx/jsx-dev-runtime.avp.ts',
      'src/jsx/jsx-dev-runtime.js',
      'src/jsx/jsx-dev-runtime.react-server.ts',
      // prod
      'src/jsx/jsx-runtime.web.ts',
      'src/jsx/jsx-runtime.avp.ts',
      'src/jsx/jsx-runtime.js',
      'src/jsx/jsx-runtime.react-server.ts',
    ],
    loader: {
      '.js': 'copy', // directly copy js file
    },
    format: ['cjs'],
    outDir: 'dist/jsx',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        __WEB__: 'false',
      }
    },
    // publicDir: './npm/jsx/', // copy npm/jsx to dist/jsx
  },
])
