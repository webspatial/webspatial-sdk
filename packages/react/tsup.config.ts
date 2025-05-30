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
  __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(version),
}

const banner = {
  web: `
      (function(){
        if(typeof window === 'undefined') return;
        if(!window.__webspatialsdk__) window.__webspatialsdk__ = {}
        window.__webspatialsdk__['react-sdk-version'] = ${JSON.stringify(version)}
        window.__webspatialsdk__['XR_ENV'] = "web"
    })()
      `,
  avp: `
      (function(){
        if(typeof window === 'undefined') return;
        if(!window.__webspatialsdk__) window.__webspatialsdk__ = {}
        window.__webspatialsdk__['react-sdk-version'] = ${JSON.stringify(version)}
        window.__webspatialsdk__['XR_ENV'] = "avp"
    })()
      `,
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
      js: banner.web,
    },
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
    banner: {
      js: banner.avp,
    },
  },

  {
    // JSX web
    ...baseConfig,
    clean: false,
    external: ['@webspatial/react-sdk'],
    entry: [
      // dev
      'src/jsx/jsx-dev-runtime.web.ts',
      // prod
      'src/jsx/jsx-runtime.web.ts',
    ],
    format: ['esm'],
    outDir: 'dist/jsx',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        ...versionDefine,
      }
    },
    banner: {
      js: banner.web,
    },
  },
  {
    // JSX avp
    ...baseConfig,
    clean: false,
    external: ['@webspatial/react-sdk'],
    entry: [
      // dev
      'src/jsx/jsx-dev-runtime.ts',
      // prod
      'src/jsx/jsx-runtime.ts',
    ],
    format: ['esm'],
    outDir: 'dist/jsx',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        ...versionDefine,
      }
    },
    banner: {
      js: banner.avp,
    },
  },
])
