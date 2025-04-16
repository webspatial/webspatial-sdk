// tsup.config.ts
import { defineConfig, Options } from 'tsup'
import { version } from './package.json'

const baseConfig: Options = {
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
}

const versionDefine = {
  __reactsdkversion__: JSON.stringify(version),
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
        ...versionDefine,
      }
      options.resolveExtensions = [
        '.web.tsx',
        '.web.ts',
        '.tsx',
        '.ts',
        ...(options.resolveExtensions ?? []),
      ]
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
        ...versionDefine,
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
      'src/jsx/jsx-dev-runtime.ts',
      // prod
      'src/jsx/jsx-runtime.web.ts',
      'src/jsx/jsx-runtime.ts',
    ],
    // loader: {
    //   '.js': 'copy', // directly copy js file
    // },
    format: ['esm'],
    outDir: 'dist/jsx',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        ...versionDefine,
      }
    },
    // publicDir: './npm/jsx/', // copy npm/jsx to dist/jsx
  },
])
