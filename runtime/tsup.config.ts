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
    ...baseConfig,
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist',
    esbuildOptions(options) {
      options.define = {
        ...options.define,
      }
    },
  },
])
