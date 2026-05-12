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
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build, type Rollup } from 'vite'
import react from '@vitejs/plugin-react'
import { beforeAll, describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

// `STRICT_BUDGET_BYTES` is the product-level marginal-delta contract from
// the spec's "Marginal bundle delta on a typical consumer" Scenario:
// `app-typical` MUST be ≤ 8192 bytes gzipped over `app-base`.
//
// `REGRESSION_GUARD_BYTES` is the higher cap actually enforced in CI today.
// Per spec `tasks.md §12.9` ("Pre-v1 budget calibration") and the
// "8192-byte number in this PR is a design intent, not a measured
// reality" wording in spec.md, the SDK ships PR 5 ABOVE the strict
// budget — pulling `@webspatial/core-sdk`'s UA parser + capability
// table + `Spatial` / `SpatialSession` runtime classes via `getSession()`
// alone is more than 8 KB gzipped. The §12.9 follow-up calibrates the
// budget against measured reality before tagging v1, either by:
//
//   (a) optimizing the SDK / `core-sdk` (extracting the capability
//       table, lazy-loading `Spatial`, switching to a smaller error
//       helper, etc.) until the strict budget holds, OR
//   (b) opening a deferred-budget exception with explicit sign-off
//       from the v1 release approver and tightening this guard.
//
// Until then we use `REGRESSION_GUARD_BYTES` to catch NEW growth (any
// regression beyond ~10 % of today's measured value would push past
// the guard and fail CI), and we surface the strict-budget gap as
// informational telemetry so reviewers see the calibration headroom
// without re-running anything by hand.
const STRICT_BUDGET_BYTES = 8192
const REGRESSION_GUARD_BYTES = 24_576 // 24 KB; revisit in §12.9 calibration.

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

  it('app-typical (named imports) marginal sync delta — regression guard (§9.2 + §12.9)', () => {
    const baseSync = measurements['app-base']!.totalGzipBytes
    const typicalSync = measurements['app-typical']!.totalGzipBytes
    const delta = typicalSync - baseSync
    const strictHeadroom = STRICT_BUDGET_BYTES - delta
    const guardHeadroom = REGRESSION_GUARD_BYTES - delta
    // eslint-disable-next-line no-console
    console.log(
      `[marginal-delta] app-typical sync delta = ${delta} bytes ` +
        `(strict-budget ${STRICT_BUDGET_BYTES}; strict-headroom ${strictHeadroom}; ` +
        `regression-guard ${REGRESSION_GUARD_BYTES}; guard-headroom ${guardHeadroom})`,
    )
    if (delta > STRICT_BUDGET_BYTES) {
      // eslint-disable-next-line no-console
      console.warn(
        `[marginal-delta] app-typical delta (${delta} bytes) EXCEEDS the spec's 8192-byte strict budget. ` +
          `Per spec tasks.md §12.9 ("Pre-v1 budget calibration"), this is a known v1-release blocker — ` +
          `tracked separately from PR 5. Likely optimization candidates: extracting the capability table from ` +
          `core-sdk, deduplicating facade scaffolding, switching to a smaller error-construction helper.`,
      )
    }
    expect(delta).toBeLessThanOrEqual(REGRESSION_GUARD_BYTES)
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
    // informational" Scenario the absolute size MAY exceed 8 KB. Print
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
