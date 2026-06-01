// Build-output assertion: the eager entry's mixed-import registration MUST
// survive bundling AND run before the spatial chunk's polyfill side effects.
//
// Background (regression guard): `src/eager.ts` imports
// `./runtime/registerEagerEntry` (a side-effect-only module that calls
// `registerReactSdkEntry('eager')`) BEFORE it imports `./spatial`. Two ways
// this contract silently breaks in the published artifact:
//
//   1. Tree-shaken away — if `registerEagerEntry` is not in the package
//      `sideEffects` allowlist, the bundler drops the side-effect-only import,
//      so mixing `@webspatial/react-sdk` + `/eager` never throws
//      `WebSpatialMixedEntryError`.
//   2. Reordered after spatial — if the registration is inlined into
//      `eager.js`'s body, ESM evaluates all of eager's imports (including the
//      spatial chunk, which runs `@webspatial/core-sdk/install-polyfills` +
//      `initPolyfill()`) BEFORE the inlined call, so a mixed-entry throw would
//      only happen AFTER the spatial runtime was polluted.
//
// We compute the real module-evaluation order from the built dist graph and
// assert the registration side effect is reached before the spatial polyfill
// side effect.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../../dist')
const eagerEntry = resolve(distDir, 'eager.js')

const REGISTRATION_RE = /registerReactSdkEntry\(\s*["']eager["']\s*\)/
const SPATIAL_POLYFILL_RE = /install-polyfills/

// Extract this module's static import / re-export specifiers in source order.
// Handles the minified output shapes esbuild emits (no whitespace after the
// keyword): `import"X"`, `import{a}from"X"`, `import*as N from"X"`, and
// `export{a}from"X"`. Bare specifiers and dynamic `import("X")` are not matched
// (the latter is deferred and must not count toward eager evaluation order).
function importSpecifiers(source: string): string[] {
  const specs: string[] = []
  const re = /\b(?:import|export)\b\s*(?:[^"']*?\bfrom\b\s*)?["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    specs.push(m[1])
  }
  return specs
}

// Post-order DFS over the static import graph starting at `entryPath`, mirroring
// ES module evaluation order: a module's dependencies (in source order) are
// evaluated before the module's own body. Returns the linear evaluation order
// of resolved file paths (each evaluated once).
function evaluationOrder(entryPath: string): string[] {
  const order: string[] = []
  const visited = new Set<string>()

  const visit = (filePath: string): void => {
    if (visited.has(filePath)) return
    visited.add(filePath)
    if (!existsSync(filePath)) return
    const source = readFileSync(filePath, 'utf8')
    for (const spec of importSpecifiers(source)) {
      // Only follow relative imports that stay inside dist; bare specifiers
      // (react, @webspatial/core-sdk, …) are externals with no dist source.
      if (!spec.startsWith('.')) continue
      visit(resolve(dirname(filePath), spec))
    }
    // The module's own body evaluates after its dependencies.
    order.push(filePath)
  }

  visit(entryPath)
  return order
}

describe('eager entry mixed-import registration (build-output)', () => {
  it('dist/eager.js exists (built before this assertion runs)', () => {
    expect(existsSync(eagerEntry)).toBe(true)
  })

  it('retains the eager registration somewhere in the dist module graph', () => {
    const order = evaluationOrder(eagerEntry)
    const found = order.some(file =>
      REGISTRATION_RE.test(readFileSync(file, 'utf8')),
    )
    expect(found).toBe(true)
  })

  it('evaluates the eager registration BEFORE the spatial polyfill side effect', () => {
    const order = evaluationOrder(eagerEntry)

    const registrationIndex = order.findIndex(file =>
      REGISTRATION_RE.test(readFileSync(file, 'utf8')),
    )
    const spatialIndex = order.findIndex(file =>
      SPATIAL_POLYFILL_RE.test(readFileSync(file, 'utf8')),
    )

    expect(registrationIndex).toBeGreaterThanOrEqual(0)
    expect(spatialIndex).toBeGreaterThanOrEqual(0)
    expect(registrationIndex).toBeLessThan(spatialIndex)
  })
})
