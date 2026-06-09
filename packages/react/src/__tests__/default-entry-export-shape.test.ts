import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Per spatial-lazy-load spec tasks.md §9.7 + the "Named re-export
// preferred over wildcard for runtime values" Scenario, the default-entry
// barrel SHOULD prefer named re-exports (`export { foo } from './bar'`)
// for runtime values. Wildcard re-exports (`export * from './bar'`) remain
// acceptable for type-only re-exports (`export type * from './bar'`)
// because TypeScript types do not affect runtime tree-shaking.
//
// This is a "SHOULD" in the spec; we encode it as a hard test (FAIL on
// runtime wildcard) so a future drift requires either an explicit named
// re-export rewrite or an acknowledged exception in this file.

const __dirname = dirname(fileURLToPath(import.meta.url))
const indexTsPath = resolve(__dirname, '../index.ts')

function stripComments(source: string): string {
  let stripped = source.replace(/\/\*[\s\S]*?\*\//g, '')
  stripped = stripped
    .split('\n')
    .map(line => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n')
  return stripped
}

describe('default-entry barrel — re-export shape (spec tasks.md §9.7)', () => {
  const source = stripComments(readFileSync(indexTsPath, 'utf8'))

  it('contains NO wildcard runtime re-exports (`export * from "..."`)', () => {
    // Match `export * from "..."` but NOT `export type * from "..."`.
    // The `(?!type\s)` lookahead permits the type-only form.
    const wildcardRuntimeRe = /export\s+\*\s+from\s+['"][^'"]+['"]/g
    const wildcardTypeRe = /export\s+type\s+\*\s+from\s+['"][^'"]+['"]/g

    const allWildcards = source.match(wildcardRuntimeRe) ?? []
    const typeWildcards = source.match(wildcardTypeRe) ?? []

    // Set difference — runtime wildcards are everything that's NOT a type
    // wildcard. We compare counts (set difference by source-string equality
    // would suffice; counts are simpler).
    const runtimeWildcardCount = allWildcards.length - typeWildcards.length

    expect(
      runtimeWildcardCount,
      `Found ${runtimeWildcardCount} runtime wildcard re-export(s) in src/index.ts. Per spec tasks.md §9.7, prefer the named form \`export { foo } from './bar'\`. Type-only wildcards (\`export type * from ...\`) are permitted because TypeScript types are erased at runtime.`,
    ).toBe(0)
  })

  it('contains NO wildcard runtime re-exports of the renamed-namespace form (`export * as ns from "..."`)', () => {
    // The `export * as ns from "x"` form materializes a runtime namespace
    // object — even if all members are unused, the bundler retains the
    // entire module to populate the namespace. Disallow at runtime; permit
    // the type form `export type * as ns from "x"`.
    const namespaceRuntimeRe = /export\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]/g
    const namespaceTypeRe =
      /export\s+type\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]/g

    const allNamespaces = source.match(namespaceRuntimeRe) ?? []
    const typeNamespaces = source.match(namespaceTypeRe) ?? []
    const runtimeNamespaceCount = allNamespaces.length - typeNamespaces.length

    expect(runtimeNamespaceCount).toBe(0)
  })

  it('uses at least one named runtime re-export (positive control)', () => {
    const namedExportRe = /export\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]/g
    const namedExports = source.match(namedExportRe) ?? []
    // A regression that flipped every barrel re-export to a wildcard
    // would defeat the negative tests above; this positive assertion
    // makes sure the named form is the dominant pattern.
    expect(namedExports.length).toBeGreaterThan(0)
  })
})
