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
    esbuildOptions(options) {
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
  },
])
