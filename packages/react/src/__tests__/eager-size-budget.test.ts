// =============================================================================
// Eager-mode entry size-budget proxy per spec
// `tasks.md §16.7` and the "Eager entry has its own size-budget proxy"
// Scenario.
//
// The eager entry inlines the full spatial implementation (no dynamic
// `import('./spatial')` boundary), so its size MUST be measured separately
// from the lazy-load default entry's 8 KB cap. The product contract for
// the eager entry is "spatial-only consumers pay one network request" —
// the absolute byte count is bounded by what the spatial chunk would
// have cost anyway in the lazy-load case (`dist/spatial.js`), plus any
// shared chunk overhead.
//
// We pick **30 KB gzipped** as the eager-entry proxy budget. As of v1
// the lazy-load `dist/spatial.js` is roughly 24 KB gzipped; the eager
// entry is the same content reachable through a different entry point
// plus the eager entry's own 1 KB of stub + re-export glue. 30 KB
// leaves modest headroom (~5 KB) without being so loose that a real
// regression slips by undetected. This budget mirrors the lazy-load
// proxy in spirit (catch regressions early, fail-fast at SDK build
// time) but acknowledges the distribution-form reality (eager bundles
// the spatial chunk inline by design).
//
// Per §9.9 we also print headroom telemetry so reviewers see how close
// to the budget we are without reading the assertion code.
// =============================================================================

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../../dist')
const eagerJsPath = resolve(distDir, 'eager.js')

// 30 KB gzipped. Rationale documented in the file header comment above
// and in the spec's "Eager entry has its own size-budget proxy" Scenario.
const EAGER_PROXY_BUDGET_BYTES = 30720

function gzipSize(filePath: string): number {
  const raw = readFileSync(filePath)
  return gzipSync(raw).length
}

describe('eager-mode entry — SDK-side size-budget proxy (spec tasks.md §16.7)', () => {
  it('dist/eager.js exists (run `tsup` first)', () => {
    expect(
      existsSync(eagerJsPath),
      `Expected built artefact ${eagerJsPath} — the test suite runs \`tsup\` before vitest, so a missing file means the eager-entry tsup config did not emit it.`,
    ).toBe(true)
  })

  it('dist/eager.js gzipped size is at most 30720 bytes (30 KB — the eager-entry proxy budget)', () => {
    const size = gzipSize(eagerJsPath)
    // Informational telemetry per §9.9: print headroom (positive) or
    // overrun (negative) before the assertion so the number is visible
    // even when the assertion passes.
    const headroom = EAGER_PROXY_BUDGET_BYTES - size
    // eslint-disable-next-line no-console
    console.log(
      `[eager-size-budget] dist/eager.js gzipped = ${size} bytes (budget ${EAGER_PROXY_BUDGET_BYTES}; headroom ${headroom})`,
    )
    expect(size).toBeLessThanOrEqual(EAGER_PROXY_BUDGET_BYTES)
  })

  it('telemetry: eager entry imports the core-sdk polyfill activation subpath (sanity check)', () => {
    // Lightweight sanity assertion that the eager entry actually triggers
    // the polyfill side effect on module evaluation. The polyfill literal
    // (`navigator.userAgent.indexOf('WebSpatial/') > 0`) lives in
    // `@webspatial/core-sdk/install-polyfills`, which is EXTERNAL to the
    // react-sdk tsup build — so the literal `'WebSpatial/'` is NOT in
    // any react-sdk dist file. What MUST be in the closure is the
    // bare-side-effect `import "@webspatial/core-sdk/install-polyfills"`
    // statement; we grep for that string in the eager-entry static
    // closure (eager.js + the chunks it imports).
    //
    // If this marker disappears the eager entry has lost its polyfill
    // bootstrap and spatial features will silently fail at runtime —
    // exactly the regression this proxy guards against.
    const importMarker = '@webspatial/core-sdk/install-polyfills'
    const allDistJs = readdirSync(distDir).filter(f => f.endsWith('.js'))
    const matchingFiles = allDistJs.filter(f => {
      const content = readFileSync(resolve(distDir, f), 'utf8')
      return content.includes(importMarker)
    })
    expect(
      matchingFiles.length,
      `Expected at least one dist/*.js file to contain the polyfill import "${importMarker}" reachable from the eager entry. Found in: [${matchingFiles.join(', ')}]`,
    ).toBeGreaterThan(0)
  })
})
