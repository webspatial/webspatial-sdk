// tsup.config.ts
//
// Lazy-load v1 build pipeline (per spatial-lazy-load spec tasks.md §8). The
// previous dual-build (`dist/web` + `dist/default`) plus the alias-switching
// `@webspatial/vite-plugin` is replaced by ONE flat `dist/` layout:
//
// - `dist/index.js`   — default-entry barrel (facades + bridge + boot +
//                       hooks-web/useMetrics + Group B/C utilities). Size
//                       budget proxy ≤ 8 KB gzipped per spec "SDK-side
//                       `dist/index.js` size proxy" Scenario; enforced by
//                       `src/__tests__/size-budget.test.ts` (§9.1).
// - `dist/spatial.js` — bridge dynamic-import target. Owns the real spatial
//                       implementation (real `Model`, `Reality`, `*Entity`
//                       family, materials/assets, real `useMetrics`, real
//                       containers, real monitor) + the `initPolyfill()`
//                       bootstrap moved out of the default entry by PR 4.
// - `dist/jsx/jsx-runtime.js` and `dist/jsx/jsx-dev-runtime.js` — single
//   unified JSX runtime serving plain web, AVP, SSR, and RSC consumers (per
//   spec "JSX runtime strips spatial markers and wraps with facade HOCs"
//   Requirement). The previously separate `*.web.ts` siblings are physically
//   deleted in this PR per task §6.1.
//
// Code-splitting is the mechanism that keeps `dist/index.js` ≤ 8 KB: the
// bridge's dynamic `import('../spatial')` is hoisted into the spatial chunk,
// and shared modules that both `index` and the JSX runtime touch (notably
// the facades + the strip helper) collapse into a small shared chunk emitted
// alongside the entries.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Options } from 'tsup'
import { version } from './package.json'

// Banner injected into every emitted bundle. Per spec task §8.2 the legacy
// `XR_ENV` (`web` / `avp`) global write is removed — there is no longer a
// per-build flavor distinction. We only stamp the SDK version onto
// `window.__webspatialsdk__['react-sdk-version']` so existing diagnostic
// tools that read it keep working.
const sharedBanner = `
(function(){
  if(typeof window === 'undefined') return;
  if(!window.__webspatialsdk__) window.__webspatialsdk__ = {}
  window.__webspatialsdk__['react-sdk-version'] = ${JSON.stringify(version)}
})()
`.trim()

const versionDefine = {
  __WEBSPATIAL_REACT_SDK_VERSION__: JSON.stringify(version),
}

// Treat React + React DOM as external — they are required peer dependencies
// per `package.json` and contribute zero bytes to the SDK's own bundle.
// `@webspatial/core-sdk` is also a peer; the previous web build aliased it
// to `src/noRuntime.ts`, but the lazy-load v1 default entry now exposes the
// real `core-sdk` surface (Group B/C utilities) and `core-sdk` is counted in
// the consumer-side marginal-delta budget (§9.2), not in the SDK-side proxy.
const externals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  '@webspatial/core-sdk',
]

const baseConfig: Options = {
  format: ['esm'],
  sourcemap: true,
  dts: true,
  external: externals,
  banner: { js: sharedBanner },
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      ...versionDefine,
    }
  },
}

export default defineConfig([
  // Bundle 1 — default entry + spatial chunk + JSX runtimes, all in a single
  // tsup pass with `splitting: true` so esbuild can:
  //
  //   (a) emit `dist/spatial.js` as the dynamic-import target referenced by
  //       the bridge (`runtime/bridge.ts:loadSpatialImpl`), per spec
  //       "Spatial implementation MUST live in a dynamically importable
  //       subpath" Requirement;
  //   (b) hoist code shared by `dist/index.js` and the JSX runtime entries
  //       (notably the facades + `replaceToSpatialPrimitiveType`) into a
  //       small shared chunk so both consumers reuse a single copy instead
  //       of duplicating it across files;
  //   (c) keep the dynamic `import('../spatial')` literal as a separate
  //       network request rather than inlining the spatial surface into the
  //       default entry.
  //
  // The four entry keys also dictate the output filenames (e.g.
  // `jsx/jsx-runtime` → `dist/jsx/jsx-runtime.js`), so the
  // `package.json#exports` mappings in §8.3 stay deterministic.
  {
    ...baseConfig,
    clean: true,
    splitting: true,
    entry: {
      index: 'src/index.ts',
      // The eager-mode entry per spec tasks.md §16. Statically links the
      // spatial implementation so spatial-only consumers pay one network
      // request instead of two. Lives alongside `index` in the same
      // `splitting: true` chunk graph so shared utilities collapse into a
      // common chunk and the eager entry does NOT duplicate code that the
      // default entry already ships.
      eager: 'src/eager.ts',
      spatial: 'src/spatial/index.ts',
      'jsx/jsx-runtime': 'src/jsx/jsx-runtime.ts',
      'jsx/jsx-dev-runtime': 'src/jsx/jsx-dev-runtime.ts',
    },
    outDir: 'dist',
    onSuccess: async () => {
      // Per spatial-lazy-load spec "SSR and hydration safety" Requirement
      // ("Client-component directive" bullet) + tasks.md §13.1: the public
      // default-entry MUST carry `'use client'` so RSC bundlers (Next.js
      // App Router) treat `@webspatial/react-sdk` as a Client Component
      // boundary — without it, server components that import a facade
      // would attempt to render React hooks server-side and fail.
      //
      // Splitting (`splitting: true`, §8.1) merges multiple source files
      // into shared chunks, so esbuild cannot preserve a per-source-file
      // `'use client'` at chunk boundaries. The pragmatic answer is to
      // inject the directive at the public RSC boundary (`dist/index.js`)
      // — the only file consumer-side bundlers see directly. Internal
      // chunks (`dist/chunk-*.js`) are reached transitively, already
      // inside the client subgraph by the time React's RSC compiler
      // walks them.
      //
      // Negative cases per the same Requirement / spec preamble:
      //   - `dist/jsx/jsx-runtime.js`, `dist/jsx/jsx-dev-runtime.js`
      //     do NOT use React hooks → MUST NOT carry the directive
      //   - `dist/spatial.js` is the dynamic-import target (NOT a static
      //     RSC entry) → MUST NOT carry the directive
      // The §13.1 build-output assertion enforces both polarities.
      const directive = `'use client';\n`
      const ensureUseClient = (filePath: string): void => {
        const current = readFileSync(filePath, 'utf8')
        if (!current.startsWith(directive.trimEnd())) {
          writeFileSync(filePath, directive + current)
        }
      }
      // Default entry — RSC client boundary.
      ensureUseClient(resolve(__dirname, 'dist/index.js'))
      // Eager entry per spec tasks.md §16 — also a public RSC boundary
      // because consumers may import facade-equivalent symbols + the
      // `useSpatialReady` stub from a Server Component file. Without
      // the directive the RSC compiler would attempt server execution
      // of the underlying hook code and fail at the first hook call.
      ensureUseClient(resolve(__dirname, 'dist/eager.js'))
    },
  },
])
