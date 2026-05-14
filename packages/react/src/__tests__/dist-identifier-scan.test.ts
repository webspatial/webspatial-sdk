import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Per spatial-lazy-load spec tasks.md §9.4 + the "Spatial-only identifiers
// are absent from default entry" Scenario, the published default-entry
// bundle MUST NOT contain any of the spatial-only identifier names. The
// list is verbatim from the Scenario; if a name in the list ever surfaces
// in `dist/index.js` (or in a chunk reachable from it via static
// `import` / `export`) the test fails.
//
// Code-splitting (`tsup splitting: true` per `tsup.config.ts` §8.1) emits
// shared modules into hashed chunk files alongside `dist/index.js`. The
// scan therefore covers `dist/index.js` plus the transitive closure of
// chunks reachable from it; spatial-only chunks (notably `dist/spatial.js`,
// the bridge's dynamic-import target) are explicitly excluded since they
// are NOT part of the default-entry static module graph.

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../../dist')
const indexJsPath = resolve(distDir, 'index.js')
const spatialJsPath = resolve(distDir, 'spatial.js')

// Verbatim from `specs/spatial-lazy-load/spec.md` "Spatial-only identifiers
// are absent from default entry" Scenario. Function-body identifiers
// (real-`Model` symbols, real reality-hook implementations) are listed
// alongside the constructor names so a future re-introduction surfaces.
//
// `withSpatialized2DElementContainer` and `withSpatialMonitor` are the
// **public facade HOCs** and DO appear in the default entry — the Scenario
// explicitly distinguishes "real-implementation function bodies … (distinct
// from their facade re-exports)". The match is intentionally on the
// function-body identifier names, not on the facade-export names.
const FORBIDDEN_IDENTIFIERS = [
  'Spatialized2DElementContainer',
  'SpatializedStatic3DElementContainer',
  'PortalSpatializedContainer',
  'StandardSpatializedContainer',
  'SpatialMonitor',
  'ResourceRegistry',
  'AttachmentRegistry',
  // Internal reality hooks — never publicly exported, MUST live in the
  // spatial chunk only (per `tasks.md §5.3`).
  'useEntity',
  'useEntityRef',
  'useEntityTransform',
  'useEntityEvent',
  'useEntityId',
  'useRealityEvents',
  'useForceUpdate',
] as const

// Whitelisted occurrences — substrings that legitimately contain a
// forbidden token but are NOT the forbidden symbol itself. Examples:
//
// - The facade HOC `withSpatialized2DElementContainer` legitimately
//   contains the `Spatialized2DElementContainer` substring; it is the
//   public API, not the internal constructor.
// - The error message string in `WebSpatialBootError` may mention
//   "WebSpatial" but never contains a forbidden internal symbol.
//
// These exact substrings are stripped from each scanned file before the
// per-identifier substring check runs.
const SUBSTRING_WHITELIST = [
  'withSpatialized2DElementContainer',
  'WithSpatialized2DElementContainer',
  'withSpatialMonitor',
  'WithSpatialMonitor',
] as const

type ChunkScanReport = {
  files: string[]
  matches: Array<{ file: string; identifier: string; line: string }>
}

function findStaticImportPaths(source: string): string[] {
  const paths: string[] = []
  // tsup-emitted output uses static `import { x } from "./chunk-XXX.js"` and
  // `export { x } from "./chunk-XXX.js"`. We only need RELATIVE specifiers
  // here (`./` or `../`) — bare specifiers (`react`, `@webspatial/...`) are
  // external peer / leaf packages and cannot pull in spatial-only code.
  const importRe =
    /(?:^|\s)(?:import|export)\s+[^'";]*?from\s+['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = importRe.exec(source)) !== null) {
    const spec = match[1]
    if (spec.startsWith('./') || spec.startsWith('../')) {
      paths.push(spec)
    }
  }
  // bare side-effect import: `import "./chunk-XXX.js"`
  const sideEffectRe = /(?:^|\s)import\s+['"]([^'"]+)['"]/g
  while ((match = sideEffectRe.exec(source)) !== null) {
    const spec = match[1]
    if (spec.startsWith('./') || spec.startsWith('../')) {
      paths.push(spec)
    }
  }
  return paths
}

function scanReachableChunks(): ChunkScanReport {
  // BFS from `dist/index.js` over relative ESM imports. The dynamic
  // `import("./spatial.js")` from the bridge is NOT a static import, so the
  // walk naturally stops at the spatial chunk — the static-graph closure
  // and the dynamic chunk are physically distinct, which is the contract
  // we are enforcing.
  const visited = new Set<string>()
  const queue: string[] = [indexJsPath]
  const matches: ChunkScanReport['matches'] = []

  while (queue.length > 0) {
    const file = queue.shift()!
    if (visited.has(file)) continue
    visited.add(file)
    if (!existsSync(file)) continue

    let source = readFileSync(file, 'utf8')

    // Strip whitelisted substrings (facade HOC names) so the inner forbidden
    // tokens do not match a substring scan. Replace with a sentinel so we
    // do not accidentally fuse adjacent identifiers.
    for (const allowed of SUBSTRING_WHITELIST) {
      source = source.split(allowed).join('__WHITELISTED__')
    }

    // Per-identifier substring scan. We use a word-boundary-aware regex
    // (anchor on non-identifier chars) so e.g. `Spatialized2DElementContainerProps`
    // (a TYPE name, no runtime code) wouldn't match — but the type names are
    // erased from `.js` outputs anyway so this is defensive.
    for (const identifier of FORBIDDEN_IDENTIFIERS) {
      const re = new RegExp(`(?<![A-Za-z0-9_$])${identifier}(?![A-Za-z0-9_$])`)
      const m = re.exec(source)
      if (m) {
        // Extract the line for context.
        const lineStart = source.lastIndexOf('\n', m.index) + 1
        const lineEnd = source.indexOf('\n', m.index)
        const line = source.slice(
          lineStart,
          lineEnd === -1 ? source.length : lineEnd,
        )
        matches.push({ file, identifier, line: line.trim() })
      }
    }

    // Follow static imports to chunk siblings.
    for (const spec of findStaticImportPaths(source)) {
      const resolved = resolve(dirname(file), spec)
      // `dist/spatial.js` is the bridge's dynamic-import target — it MUST
      // NOT appear here (it would mean the static graph leaked into the
      // spatial chunk). We assert that separately below.
      if (resolved === spatialJsPath) continue
      queue.push(resolved)
    }
  }

  return { files: [...visited], matches }
}

describe('dist identifier scan — spatial-only identifiers absent from default entry (spec tasks.md §9.4)', () => {
  it('dist/index.js exists (run `pnpm build` first)', () => {
    expect(existsSync(indexJsPath)).toBe(true)
    expect(existsSync(spatialJsPath)).toBe(true)
  })

  const report = scanReachableChunks()

  it('default-entry static-graph closure contains NONE of the spatial-only identifiers', () => {
    // Failure message lists every offending identifier + file + the
    // specific line so the regression source is obvious without re-running
    // the test under a debugger.
    expect(report.matches).toEqual([])
  })

  it('static graph from dist/index.js does NOT statically import dist/spatial.js', () => {
    // Belt-and-braces: the bridge MUST reach the spatial chunk only via a
    // dynamic `import('./spatial.js')`. A regression that flips the
    // dynamic import to a static one would be silently masked by the
    // identifier-scan whitelist (the facade HOC names cover the internal
    // constructors' substrings), so we assert the file boundary here.
    const indexSource = readFileSync(indexJsPath, 'utf8')
    const staticImportsSpatial =
      /(?:^|\s)(?:import|export)\s+[^'"\n]*?from\s+['"][^'"]*spatial\.js['"]/.test(
        indexSource,
      )
    expect(staticImportsSpatial).toBe(false)
  })

  it('telemetry: prints the chunk closure walked', () => {
    // §9.9 informational output — list each chunk file the scan touched so
    // a reviewer can reason about which files contribute to the identifier
    // scan's coverage without re-executing the BFS by hand.
    const distRoot = resolve(__dirname, '../../dist')
    const relative = report.files.map(f =>
      f.startsWith(distRoot + '/') ? f.slice(distRoot.length + 1) : f,
    )
    // eslint-disable-next-line no-console
    console.log(
      `[identifier-scan] default-entry closure: ${relative.join(', ')}`,
    )
    expect(report.files.length).toBeGreaterThan(0)
  })

  it('positive control: spatial chunk closure DOES contain at least one forbidden identifier (sanity-check)', () => {
    // If the spatial chunk's closure ever stops containing the internal
    // constructors, either the spatial chunk has been gutted (regression)
    // OR the identifier list above has drifted from what `core-sdk`
    // exposes and needs maintaining. Either way this assertion forces
    // the investigation.
    //
    // NOTE: with `splitting: true` (per `tsup.config.ts`) AND the eager
    // entry now also pulling the spatial implementation (per spec §16),
    // the actual spatial implementation no longer lives in `dist/spatial.js`
    // itself — it has been hoisted into shared chunks reachable from
    // BOTH `dist/spatial.js` and `dist/eager.js`. We therefore walk
    // `dist/spatial.js`'s static-import closure (same primitive used by
    // the negative-control test above) and check the union for forbidden
    // identifiers.
    const visited = new Set<string>()
    const queue: string[] = [spatialJsPath]
    while (queue.length > 0) {
      const file = queue.shift()!
      if (visited.has(file)) continue
      visited.add(file)
      if (!existsSync(file)) continue
      const source = readFileSync(file, 'utf8')
      for (const spec of findStaticImportPaths(source)) {
        const resolved = resolve(dirname(file), spec)
        queue.push(resolved)
      }
    }
    const allSource = [...visited]
      .filter(f => existsSync(f))
      .map(f => readFileSync(f, 'utf8'))
      .join('\n')
    const present = FORBIDDEN_IDENTIFIERS.filter(id => {
      const re = new RegExp(`(?<![A-Za-z0-9_$])${id}(?![A-Za-z0-9_$])`)
      return re.test(allSource)
    })
    const walked = [...visited].map(f =>
      f.startsWith(distDir + '/') ? f.slice(distDir.length + 1) : f,
    )
    expect(
      present.length,
      `Expected the dist/spatial.js closure to contain at least one of the spatial-only identifiers (${FORBIDDEN_IDENTIFIERS.slice(0, 4).join(', ')}, ...). Closure walked: [${walked.join(', ')}]`,
    ).toBeGreaterThan(0)
  })
})
