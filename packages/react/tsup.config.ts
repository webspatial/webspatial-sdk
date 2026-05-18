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
//
// `@webspatial/react-sdk/internal/facades-client` is treated as external too:
// `src/jsx/jsx-shared.ts` reaches the facade trio through that subpath so
// the published `dist/jsx/jsx-runtime.js` chunk graph terminates at the
// `'use client'` boundary in `dist/internal/facades-client.js` (see
// `src/internal/facades-client.ts` for the full RSC-compatibility rationale).
// All other dist entries reach facades through the relative path
// (`src/facades/index.ts`), so this externalisation does NOT round-trip
// the default-entry / eager / spatial bundles through an extra subpath
// import — only the JSX runtime chunks.
const externals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  '@webspatial/core-sdk',
  '@webspatial/react-sdk/internal/facades-client',
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

// Next.js / RSC requires `'use client'` to be the very first statement in
// a module — before the version banner IIFE. esbuild may also emit a stray
// second directive mid-file when splitting re-exports from `'use client'`
// source files; strip duplicates and reorder to:
//   'use client' → banner → body
const directive = `'use client';\n`
const bannerRe = /^\(function\(\)\{[\s\S]*?\}\)\(\)\s*\n/
const useClientRe = /^['"]use client['"];\s*\n/gm
const ensureRscClientBoundary = (filePath: string): void => {
  let current = readFileSync(filePath, 'utf8')
  let banner = ''
  const bannerMatch = current.match(bannerRe)
  if (bannerMatch) {
    banner = bannerMatch[0]
    current = current.slice(banner.length)
  }
  current = current.replace(useClientRe, '')
  writeFileSync(filePath, directive + banner + current)
}

export default defineConfig([
  // Bundle 1 — default entry + spatial chunk + eager entry + internal
  // `'use client'` facade subpath. All four reach the facade implementations
  // through relative imports and end up co-located in a `splitting: true`
  // shared-chunk graph that is fine to mix with React-hook code (every
  // public-callable entry in this bundle either carries `'use client'`
  // directly — `index.js`, `eager.js`, `internal/facades-client.js` — or is
  // unreachable from RSC server modules via a static import — `spatial.js`
  // is a dynamic-import target only).
  //
  //   (a) emits `dist/spatial.js` as the dynamic-import target referenced
  //       by the bridge (`runtime/bridge.ts:loadSpatialImpl`), per spec
  //       "Spatial implementation MUST live in a dynamically importable
  //       subpath" Requirement.
  //   (b) hoists code shared by the default + eager + facade entries
  //       (notably the facade HOCs and their hook dependencies) into a
  //       single shared chunk so the eager entry does NOT duplicate code
  //       the default entry already ships.
  //   (c) keeps the dynamic `import('../spatial')` literal as a separate
  //       network request rather than inlining the spatial surface into
  //       the default entry.
  //
  // The entry keys dictate the output filenames (e.g. `internal/facades-client`
  // → `dist/internal/facades-client.js`), so the `package.json#exports`
  // mappings stay deterministic.
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
      // Internal `'use client'` boundary used exclusively by the JSX
      // runtime (Bundle 2 below). Lives in this bundle so it shares the
      // facade source files with `index.ts` / `eager.ts` via the same
      // splitting graph — preserving the contract that
      // `import { Model } from '@webspatial/react-sdk'` resolves to the
      // SAME module-level binding (and therefore the SAME function
      // identity) that the JSX runtime sees via the external subpath.
      'internal/facades-client': 'src/internal/facades-client.ts',
    },
    outDir: 'dist',
    onSuccess: async () => {
      // Per spatial-lazy-load spec "SSR and hydration safety" Requirement
      // ("Client-component directive" bullet) + tasks.md §13.1: every
      // public RSC boundary MUST start with `'use client'` so consumer
      // bundlers (Next.js App Router) treat the imported names as Client
      // Component references and stop walking before the file's hook
      // call sites.
      //
      // Splitting (`splitting: true`) merges multiple source files into
      // shared chunks, so esbuild cannot preserve a per-source-file
      // `'use client'` at chunk boundaries. We therefore inject the
      // directive at the PUBLIC RSC boundary entry files only —
      // internal chunks (`dist/chunk-*.js`) are reached transitively,
      // already inside the client subgraph by the time React's RSC
      // compiler walks them.
      //
      // Negative cases per the same Requirement / spec preamble:
      //   - `dist/jsx/jsx-runtime.js`, `dist/jsx/jsx-dev-runtime.js`
      //     do NOT use React hooks and MUST stay server-callable →
      //     MUST NOT carry the directive (Bundle 2 below)
      //   - `dist/spatial.js` is the dynamic-import target (NOT a static
      //     RSC entry) → MUST NOT carry the directive
      // The §13.1 build-output assertion enforces both polarities.

      // Default entry — RSC client boundary.
      ensureRscClientBoundary(resolve(__dirname, 'dist/index.js'))
      // Eager entry per spec tasks.md §16 — also a public RSC boundary
      // because consumers may import facade-equivalent symbols + the
      // `useSpatialReady` stub from a Server Component file. Without
      // the directive the RSC compiler would attempt server execution
      // of the underlying hook code and fail at the first hook call.
      ensureRscClientBoundary(resolve(__dirname, 'dist/eager.js'))
      // Internal facade boundary — the entire point of this entry is to
      // be a `'use client'` stop for the JSX runtime (see
      // `src/internal/facades-client.ts` and Bundle 2's external config).
      ensureRscClientBoundary(
        resolve(__dirname, 'dist/internal/facades-client.js'),
      )
    },
  },
  // Bundle 2 — JSX runtime entries. ISOLATED from Bundle 1 so the
  // resulting `dist/jsx/jsx-runtime.js` and its shared chunks are
  // GUARANTEED to contain no React hook imports: the facade trio used by
  // `jsx-shared.ts` is reached only through the external package
  // self-reference `@webspatial/react-sdk/internal/facades-client`
  // (declared in `externals` above), which esbuild leaves as a literal
  // import in the emitted bundle. Next's RSC compiler walks
  //   `jsx-runtime.js` → its splitting chunk(s) → external subpath
  // and stops at the `'use client'` directive at the top of
  // `dist/internal/facades-client.js`, treating the imports as Client
  // References. The runtime check `canWrapWithFacade` in `jsx-shared.ts`
  // detects this case (Client References are objects, not functions) and
  // degrades to "strip markers, do not HOC-wrap".
  //
  // Keeping the JSX runtime in its own tsup pass also ensures the
  // `jsx-shared.ts` source — which would otherwise live in a shared
  // chunk with hook-bearing modules in Bundle 1 — sits in a chunk graph
  // that contains only JSX-runtime-adjacent code.
  {
    ...baseConfig,
    splitting: true,
    entry: {
      'jsx/jsx-runtime': 'src/jsx/jsx-runtime.ts',
      'jsx/jsx-dev-runtime': 'src/jsx/jsx-dev-runtime.ts',
    },
    outDir: 'dist',
  },
])
