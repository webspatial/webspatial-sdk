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
  __coresdkversion__: JSON.stringify(version),
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
