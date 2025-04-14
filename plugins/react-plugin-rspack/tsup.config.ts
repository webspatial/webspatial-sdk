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
    ...baseConfig,
    entry: ['src/index.ts'],
    format: [/*'cjs',*/ 'esm'],
    outDir: 'dist',
    // outExtension: ctx => {
    //   if (ctx.format === 'esm') {
    //     return {
    //       js: '.mjs',
    //     }
    //   }
    //   return {
    //     js: '.js',
    //   }
    // },
  },
])
