// tsup.config.ts
import { defineConfig, Options } from 'tsup'
import { version } from './package.json'
const baseConfig: Options = {
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  banner: {
    js: `
    (function(){
      if(typeof window === 'undefined') return;
      if(!window.__webspatialsdk__) window.__webspatialsdk__ = {}
      window.__webspatialsdk__['core-sdk-version'] = ${JSON.stringify(version)}
  })()
    `,
  },
}

const versionDefine = {
  __WEBSPATIAL_CORE_SDK_VERSION__: JSON.stringify(version),
}

export default defineConfig([
  {
    ...baseConfig,
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        ...versionDefine,
      }
    },
  },
  {
    ...baseConfig,
    entry: ['src/index.ts'],
    format: ['iife'],
    outDir: 'dist/iife',
    globalName: 'webspatialCore',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        ...versionDefine,
      }
    },
    minify: true,
  },
])
