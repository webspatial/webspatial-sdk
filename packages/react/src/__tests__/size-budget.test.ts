import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

// Per spatial-lazy-load spec tasks.md §9.1 ("SDK-side `dist/index.js` size
// proxy" Scenario), the published default-entry bundle MUST be at most
// 5120 bytes when gzipped on its own. This is the SDK-side proxy that
// runs inside the package's own test suite without a fixture build; the
// downstream marginal-delta contract from §9.2 is enforced by the
// fixture under `tests/marginal-delta-vite/` and gates the package size in
// the consumer's measured reality.
//
// §9.9 also asks us to print headroom telemetry so reviewers can see how
// close we are to the budget without reading the assertion code.

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../../dist')
const indexJsPath = resolve(distDir, 'index.js')
const spatialJsPath = resolve(distDir, 'spatial.js')

const PROXY_BUDGET_BYTES = 5120

function gzipSize(filePath: string): number {
  const raw = readFileSync(filePath)
  return gzipSync(raw).length
}

describe('size-budget — SDK-side proxy (spec tasks.md §9.1 + §9.9)', () => {
  it('dist/ has been built (run `pnpm build` first)', () => {
    expect(
      existsSync(indexJsPath),
      `Expected built artefact ${indexJsPath} — the test suite runs \`tsup\` before vitest, so a missing file means the build itself failed.`,
    ).toBe(true)
    expect(existsSync(spatialJsPath)).toBe(true)
  })

  it('dist/index.js gzipped size is at most 5120 bytes (the SDK-side proxy budget)', () => {
    const size = gzipSize(indexJsPath)
    // Informational telemetry per §9.9: print headroom (positive) or
    // overrun (negative) before the assertion so the number is visible
    // even when the assertion passes.
    const headroom = PROXY_BUDGET_BYTES - size
    // eslint-disable-next-line no-console
    console.log(
      `[size-budget] dist/index.js gzipped = ${size} bytes (budget ${PROXY_BUDGET_BYTES}; headroom ${headroom})`,
    )
    expect(size).toBeLessThanOrEqual(PROXY_BUDGET_BYTES)
  })

  it('telemetry: dist/spatial.js gzipped size is recorded for reviewer visibility', () => {
    // The spatial chunk has no normative size budget (it is downloaded
    // only inside WebSpatial runtimes, after `bootSpatial()`), but the
    // number is informational per §9.9 — log it so reviewers can spot a
    // surprise jump.
    const size = gzipSize(spatialJsPath)
    // eslint-disable-next-line no-console
    console.log(
      `[size-budget] dist/spatial.js gzipped = ${size} bytes (informational; no normative cap)`,
    )
    expect(size).toBeGreaterThan(0)
  })
})
