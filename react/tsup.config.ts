// tsup.config.ts
import { defineConfig, Options } from 'tsup'
import { version } from './package.json'

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
    banner: {
      js: `
      (function(){
        if(typeof window === 'undefined') return;
        if(!window.__webspatialsdk__) window.__webspatialsdk__ = {}
        window.__webspatialsdk__['react-sdk-version'] = ${JSON.stringify(version)}
        window.__webspatialsdk__['XR_ENV'] = "web"
    })()
      `,
    },
    esbuildOptions(options) {
      options.alias = {
        '@webspatial/core-sdk': './src/noRuntime.ts',
      }
      options.define = {
        ...options.define,
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
      }
    },
    banner: {
      js: `
      (function(){
        if(typeof window === 'undefined') return;
        if(!window.__webspatialsdk__) window.__webspatialsdk__ = {}
        window.__webspatialsdk__['react-sdk-version'] = ${JSON.stringify(version)}
        window.__webspatialsdk__['XR_ENV'] = "avp"
    })()
      `,
    },
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
    format: ['esm'],
    outDir: 'dist/jsx',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
      }
    },
  },
])
