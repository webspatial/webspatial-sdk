// tsup.config.ts
import { defineConfig, Options } from 'tsup'
import { version } from './package.json'

// `bundle: false` makes tsup transpile each source file to its own
// output file (the ESM module graph is preserved 1-to-1). This is a
// precondition for fine-grained downstream tree-shaking: with the
// previous `bundle: true` (tsup's default) every source file collapsed
// into a single `dist/index.js` (or with `splitting: true`, into one
// shared chunk per entry) whose internal `__export` helper for wildcard
// re-exports (`export * from './reality'`, etc.) **defeated** consumer
// tree-shaking — Rollup / Vite / esbuild could not statically determine
// which named exports were reachable from a given consumer call site,
// so consumers ended up bundling `Spatial`, `SpatialSession`, all
// geometry creators, `scene-polyfill`, etc. even when they only imported
// a single helper like `isSSREnv` or `supports`. Per the lazy-load
// proposal `tasks.md §12.9` ("Pre-v1 budget calibration"), this is a
// precondition for react-sdk's marginal-delta budget to hold against
// typical consumers.
const baseConfig: Options = {
  bundle: false,
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
    // ESM build: emit one output file per source file (`bundle: false`
    // above) so consumer bundlers can tree-shake at file granularity.
    // The entry points to the entire `src/` tree; `**/*.test.ts` is
    // excluded so Vitest fixtures don't ship in the published package.
    entry: ['src/**/*.ts', '!src/**/*.test.ts', '!src/iife-entry.ts'],
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
    // IIFE build uses `iife-entry.ts` instead of `index.ts` so direct-browser
    // consumers retain the historical auto-install behavior (the IIFE
    // entry re-exports the public API + runs `install-polyfills` at
    // evaluation time). See `src/iife-entry.ts`.
    //
    // `bundle: true` (overrides the base config's `bundle: false`) is
    // required for IIFE because IIFE format MUST emit a single
    // self-contained file (no dynamic module resolver in the IIFE format).
    bundle: true,
    entry: ['src/iife-entry.ts'],
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
