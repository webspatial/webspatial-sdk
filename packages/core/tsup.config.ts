// tsup.config.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
}

const versionDefine = {
  __WEBSPATIAL_CORE_SDK_VERSION__: JSON.stringify(version),
}

// Diagnostic version stamp. This is intentionally NOT a tsup `banner`: with
// `bundle: false` a banner is injected into EVERY emitted `dist/*.js` file,
// turning each one into a top-level `window.__webspatialsdk__` write. That
// (a) contradicts the `package.json` `sideEffects` allowlist (which declares
// only `install-polyfills.js` as side-effectful) and (b) multiplies the stamp
// across a consumer's bundle (one copy per source file pulled in). Instead we
// post-build stamp ONLY the single ESM file that legitimately already has a
// side effect — `dist/install-polyfills.js` — so a bundled WebSpatial consumer
// still reports `core-sdk-version` when the polyfill installs, and every other
// ESM module stays side-effect-free.
const versionStamp = `
(function(){
  if(typeof window === 'undefined') return;
  if(!window.__webspatialsdk__) window.__webspatialsdk__ = {}
  window.__webspatialsdk__['core-sdk-version'] = ${JSON.stringify(version)}
})()
`.trim()

const prependVersionStamp = (filePath: string): void => {
  const current = readFileSync(filePath, 'utf8')
  if (current.includes("__webspatialsdk__['core-sdk-version']")) return
  writeFileSync(filePath, `${versionStamp}\n${current}`)
}

export default defineConfig({
  ...baseConfig,
  // ESM build: emit one output file per source file (`bundle: false`
  // above) so consumer bundlers can tree-shake at file granularity.
  // The entry points to the entire `src/` tree; `**/*.test.ts` is
  // excluded so Vitest fixtures don't ship in the published package.
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  format: ['esm'],
  outDir: 'dist',
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      ...versionDefine,
    }
  },
  onSuccess: async () => {
    // Stamp only the side-effectful ESM entry (see `versionStamp` rationale).
    prependVersionStamp(resolve(__dirname, 'dist/install-polyfills.js'))
  },
})
