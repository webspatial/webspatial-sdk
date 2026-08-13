// =============================================================================
// Marginal-delta consumer fixture (spatial-lazy-load spec tasks.md §9.2 +
// §9.3 + §9.9).
//
// We programmatically run Vite's library build for three small consumer
// apps under `src/`:
//
// - `app-base`        — no SDK import (baseline).
// - `app-typical`     — `import { Model, bootSpatial } from
//                       '@webspatial/react-sdk'` plus minimal usage.
// - `app-namespace`   — `import * as ReactSdk from '@webspatial/react-sdk'`
//                       with a side-effect reference, so Rollup retains
//                       every reachable barrel export.
//
// React + react-dom are kept external (peer deps in real consumer apps)
// so their bytes don't dominate. `@webspatial/core-sdk` is bundled
// in — per the spec the marginal delta MUST include any bytes the
// bundler pulls from `core-sdk` as a transitive consequence of
// importing `@webspatial/react-sdk`.
//
// Only the **synchronously-reachable** chunks count toward the budget.
// The bridge's dynamic `import('@webspatial/react-sdk/spatial')` produces
// a separate async chunk in the consumer bundle; that chunk is fetched
// only inside WebSpatial runtimes (`bootSpatial()` is a no-op in plain
// browsers per the bridge's `detectSpatialRuntime` gate), so it does
// NOT contribute to the "what the typical consumer pays" delta. We walk
// the Rollup output graph (`OutputChunk.imports` is the static-import
// list; `dynamicImports` is the async one) and sum gzipped sizes for
// the entry plus its static-import closure only.
// =============================================================================
import { existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build, type Rollup } from 'vite'
import react from '@vitejs/plugin-react'
import { beforeAll, describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

// `STRICT_BUDGET_BYTES` is the product-level marginal-delta contract from
// the spec's "Marginal bundle delta on a typical consumer" Scenario:
// `app-typical` MUST be ≤ 5120 bytes gzipped over `app-base`.
//
// PR 5 originally shipped this fixture with a temporary
// `REGRESSION_GUARD_BYTES = 24_576` ceiling because the measured delta
// was ~19 KB (`@webspatial/core-sdk`'s tsup config used `bundle: true,
// splitting: false`, which collapsed the entire SDK into one giant
// bundle whose internal `__export` runtime helper for wildcard
// re-exports defeated consumer tree-shaking). The §12.9 calibration
// follow-up landed in a sibling PR (`feat/extract-core-sdk-polyfills`)
// that:
//   1. extracted the polyfill side effect from `core-sdk/index.ts` to
//      `@webspatial/core-sdk/install-polyfills`,
//   2. routed the default-entry utilities (`enableDebugTool`,
//      `convertCoordinate`, `initScene`) through the bridge instead of
//      directly statically importing `getSession()`,
//   3. switched `core-sdk`'s ESM build to `bundle: false` so per-file
//      tree-shaking actually works downstream.
//
// After those three changes, the measured `app-typical` delta dropped
// from 19433 bytes to ~1600 bytes (a ~92 % reduction, well under the
// strict 5 KB budget) and the tree-shake ratio rose from 1.11× to
// ~3.3× (squarely inside the spec's healthy 2–3× range). The temporary
// regression-guard ceiling was therefore dropped: this assertion now
// enforces the strict 5 KB budget directly, exactly as `tasks.md §9.2`
// pins.
const STRICT_BUDGET_BYTES = 5120

// Sanity-check that the SDK has been built before we run — the fixture
// uses the workspace symlink, which serves `dist/` files via the
// package.json `exports` mapping. A missing dist would silently route
// every import to nothing useful.
const sdkDistIndex = resolve(__dirname, '../../packages/react/dist/index.js')
if (!existsSync(sdkDistIndex)) {
  throw new Error(
    `Marginal-delta fixture requires packages/react/dist to be built first. Missing: ${sdkDistIndex}\n` +
      `Run \`pnpm --filter @webspatial/react-sdk build\` before this fixture.`,
  )
}

type AppName = 'app-base' | 'app-typical' | 'app-namespace'

type AppMeasurement = {
  name: AppName
  totalGzipBytes: number
  totalRawBytes: number
  syncChunks: Array<{ fileName: string; gzipBytes: number; rawBytes: number }>
  dynamicChunks: Array<{
    fileName: string
    gzipBytes: number
    rawBytes: number
  }>
}

async function buildApp(name: AppName): Promise<AppMeasurement> {
  const outDir = resolve(__dirname, `dist/${name}`)
  if (existsSync(outDir)) rmSync(outDir, { recursive: true })

  const result = (await build({
    root: __dirname,
    plugins: [react()],
    logLevel: 'silent',
    configFile: false,
    build: {
      outDir,
      emptyOutDir: true,
      minify: 'esbuild',
      target: 'es2022',
      sourcemap: false,
      reportCompressedSize: false,
      lib: {
        entry: resolve(__dirname, `src/${name}.tsx`),
        formats: ['es'],
        fileName: () => 'app.js',
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
        ],
      },
    },
  })) as Rollup.RollupOutput | Rollup.RollupOutput[]

  // `vite build` returns RollupOutput[] when multiple formats are emitted.
  // We requested only `['es']` so we take the first entry.
  const output = Array.isArray(result) ? result[0] : result

  // Build a chunk map and locate the entry chunk, then walk its
  // static-import closure to identify sync chunks. Anything reachable
  // ONLY via `dynamicImports` is recorded separately as informational.
  const chunkByName = new Map<string, Rollup.OutputChunk>()
  for (const item of output.output) {
    if (item.type === 'chunk') {
      chunkByName.set(item.fileName, item)
    }
  }

  const entry = output.output.find(
    (item): item is Rollup.OutputChunk => item.type === 'chunk' && item.isEntry,
  )
  if (!entry) {
    throw new Error(`No entry chunk emitted for ${name}`)
  }

  const syncReachable = new Set<string>()
  const dynamicReachable = new Set<string>()
  const queue: string[] = [entry.fileName]
  while (queue.length > 0) {
    const fileName = queue.shift()!
    if (syncReachable.has(fileName)) continue
    syncReachable.add(fileName)
    const chunk = chunkByName.get(fileName)
    if (!chunk) continue
    for (const imp of chunk.imports) {
      if (chunkByName.has(imp)) queue.push(imp)
    }
    for (const dyn of chunk.dynamicImports) {
      if (chunkByName.has(dyn) && !syncReachable.has(dyn)) {
        dynamicReachable.add(dyn)
      }
    }
  }
  // A chunk reachable both ways is sync.
  for (const f of syncReachable) dynamicReachable.delete(f)

  const measure = (
    fileName: string,
  ): { fileName: string; gzipBytes: number; rawBytes: number } => {
    const chunk = chunkByName.get(fileName)!
    const raw = Buffer.from(chunk.code, 'utf8')
    return {
      fileName,
      gzipBytes: gzipSync(raw).length,
      rawBytes: raw.length,
    }
  }

  const syncChunks = [...syncReachable].sort().map(measure)
  const dynamicChunks = [...dynamicReachable].sort().map(measure)
  const totalGzipBytes = syncChunks.reduce((s, c) => s + c.gzipBytes, 0)
  const totalRawBytes = syncChunks.reduce((s, c) => s + c.rawBytes, 0)

  return { name, totalGzipBytes, totalRawBytes, syncChunks, dynamicChunks }
}

const measurements: Partial<Record<AppName, AppMeasurement>> = {}

beforeAll(async () => {
  for (const name of ['app-base', 'app-typical', 'app-namespace'] as const) {
    measurements[name] = await buildApp(name)
  }
}, 180_000)

describe('marginal-delta — consumer-side bundle measurement (spec tasks.md §9.2 / §9.3)', () => {
  it('telemetry: print sync + async chunk sizes for each app (spec §9.9)', () => {
    for (const name of ['app-base', 'app-typical', 'app-namespace'] as const) {
      const m = measurements[name]!
      // eslint-disable-next-line no-console
      console.log(`[marginal-delta] ${name}:`)
      // eslint-disable-next-line no-console
      console.log(
        `  sync chunks (counted): ${m.totalGzipBytes} bytes gzipped (raw ${m.totalRawBytes})`,
      )
      for (const c of m.syncChunks) {
        // eslint-disable-next-line no-console
        console.log(
          `    - ${c.fileName} = ${c.gzipBytes} bytes gz / ${c.rawBytes} bytes raw`,
        )
      }
      if (m.dynamicChunks.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`  async chunks (informational, NOT counted):`)
        for (const c of m.dynamicChunks) {
          // eslint-disable-next-line no-console
          console.log(
            `    - ${c.fileName} = ${c.gzipBytes} bytes gz / ${c.rawBytes} bytes raw`,
          )
        }
      }
    }
    expect(measurements['app-base']!.totalGzipBytes).toBeGreaterThan(0)
  })

  it('app-typical (named imports) marginal sync delta is at most 5120 bytes (§9.2)', () => {
    const baseSync = measurements['app-base']!.totalGzipBytes
    const typicalSync = measurements['app-typical']!.totalGzipBytes
    const delta = typicalSync - baseSync
    const headroom = STRICT_BUDGET_BYTES - delta
    // eslint-disable-next-line no-console
    console.log(
      `[marginal-delta] app-typical sync delta = ${delta} bytes ` +
        `(strict-budget ${STRICT_BUDGET_BYTES}; headroom ${headroom})`,
    )
    expect(delta).toBeLessThanOrEqual(STRICT_BUDGET_BYTES)
  })

  it('app-namespace marginal sync delta is strictly larger than app-typical (§9.3 — tree-shake check)', () => {
    const baseSync = measurements['app-base']!.totalGzipBytes
    const typicalDelta = measurements['app-typical']!.totalGzipBytes - baseSync
    const namespaceDelta =
      measurements['app-namespace']!.totalGzipBytes - baseSync
    const ratio = namespaceDelta / Math.max(typicalDelta, 1)
    // eslint-disable-next-line no-console
    console.log(
      `[marginal-delta] tree-shake check: namespace=${namespaceDelta} bytes vs typical=${typicalDelta} bytes (ratio ${ratio.toFixed(2)}x)`,
    )
    // Spec wording: "strictly larger". A flat ratio close to 1.0 means
    // tree-shaking failed; healthy ratio is roughly 2–3×. We assert
    // strictly-greater here; the specific ratio target lives in the
    // §12.9 budget calibration follow-up, not in v1.
    expect(namespaceDelta).toBeGreaterThan(typicalDelta)
  })

  it('telemetry: app-namespace worst-case absolute size is informational, NOT a hard budget (§9.3)', () => {
    // Per spec "Worst-case namespace / full-barrel import is
    // informational" Scenario the absolute size MAY exceed 5 KB. Print
    // it so reviewers can see how close to / far from the budget the
    // worst case sits, but DO NOT fail the test on it.
    const baseSync = measurements['app-base']!.totalGzipBytes
    const namespaceDelta =
      measurements['app-namespace']!.totalGzipBytes - baseSync
    // eslint-disable-next-line no-console
    console.log(
      `[marginal-delta] app-namespace absolute delta = ${namespaceDelta} bytes (informational, no hard cap)`,
    )
    expect(namespaceDelta).toBeGreaterThan(0)
  })
})
