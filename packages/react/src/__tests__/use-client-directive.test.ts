// `'use client'` directive build-output assertion per spatial-lazy-load
// spec tasks.md §13.1 + the "SSR and hydration safety" Requirement
// "Client-component directive" bullet.
//
// The directive's purpose is RSC compatibility: when a Next.js App Router
// server module imports a facade from `@webspatial/react-sdk`, the RSC
// compiler walks the import target. If the public default entry carries
// `'use client'`, the compiler treats the imported names as Client
// Component references and stops walking; the facades' internal
// `useState` / `useSyncExternalStore` calls then run only on the client.
// Without the directive, RSC would attempt server execution and fail.
//
// **Splitting interaction (build-pipeline note)**: tsup's `splitting:
// true` (per tasks.md §8.1) merges multiple source files into shared
// chunks (`dist/chunk-*.js`). esbuild cannot preserve a per-source-file
// `'use client'` directive at chunk boundaries because the directive only
// applies to the *first* statement of a single source file. The
// pragmatic answer (and what the spec's "Client-component directive"
// bullet is about) is to inject the directive at the public RSC boundary
// only — `dist/index.js`. Internal chunks are reached transitively, AFTER
// the consumer's bundler has already crossed the client boundary, so they
// do not need their own directive.
//
// The injection happens in `tsup.config.ts`'s `onSuccess` hook; this
// test verifies the contract from the published artifact.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../../dist')

function startsWithUseClient(filePath: string): boolean {
  // The directive MAY be followed by a semicolon and MUST be the first
  // syntactically meaningful statement. tsup adds it as a top-of-file
  // string literal. Accept both `'use client'` and `"use client"` quoting,
  // with or without a trailing semicolon, allowing leading whitespace
  // for resilience against future minifiers.
  const head = readFileSync(filePath, 'utf8').slice(0, 64).trimStart()
  return /^(?:'use client'|"use client")(?:;)?\s/.test(head)
}

describe('"use client" directive on published dist (spec tasks.md §13.1)', () => {
  it('dist/ exists (run `tsup` first)', () => {
    expect(existsSync(distDir)).toBe(true)
  })

  describe('Public RSC boundary MUST carry "use client"', () => {
    it('dist/index.js begins with the "use client" directive', () => {
      const indexPath = resolve(distDir, 'index.js')
      expect(existsSync(indexPath)).toBe(true)
      expect(startsWithUseClient(indexPath)).toBe(true)
    })

    it('dist/eager.js begins with the "use client" directive (per spec §16.4)', () => {
      // The eager entry is also a public RSC boundary because consumers
      // may import facade-equivalent symbols + the `useSpatialReady` stub
      // from a Server Component file. The tsup `onSuccess` hook injects
      // the directive into both `dist/index.js` and `dist/eager.js`.
      const eagerPath = resolve(distDir, 'eager.js')
      expect(existsSync(eagerPath)).toBe(true)
      expect(startsWithUseClient(eagerPath)).toBe(true)
    })

    it('dist/internal/facades-client.js begins with the "use client" directive', () => {
      // The internal facade boundary used by the JSX runtime
      // (`src/internal/facades-client.ts`). It is reached transitively
      // from `dist/jsx/jsx-runtime.js` via the external package
      // self-reference `@webspatial/react-sdk/internal/facades-client`,
      // and Next's RSC compiler must see the directive at the top of
      // the resolved file in order to stop walking into the hook-bearing
      // chunks and serialise the imported facades as Client References.
      // See `src/internal/facades-client.ts` for the full rationale.
      const file = resolve(distDir, 'internal/facades-client.js')
      expect(existsSync(file)).toBe(true)
      expect(startsWithUseClient(file)).toBe(true)
    })
  })

  describe('Files that do NOT use React hooks MUST NOT carry "use client"', () => {
    // Per the "SSR and hydration safety" Requirement: "Files that do not
    // call React hooks (...) MUST NOT carry the directive — they remain
    // server-callable."

    it('dist/jsx/jsx-runtime.js does NOT carry the directive (no React hooks)', () => {
      const file = resolve(distDir, 'jsx/jsx-runtime.js')
      expect(existsSync(file)).toBe(true)
      expect(startsWithUseClient(file)).toBe(false)
    })

    it('dist/jsx/jsx-dev-runtime.js does NOT carry the directive (no React hooks)', () => {
      const file = resolve(distDir, 'jsx/jsx-dev-runtime.js')
      expect(existsSync(file)).toBe(true)
      expect(startsWithUseClient(file)).toBe(false)
    })

    it('dist/spatial.js does NOT carry the directive (dynamic-import target, not an RSC entry)', () => {
      // The bridge reaches `dist/spatial.js` via dynamic `import()`; the
      // RSC compiler does not statically walk into it from a server
      // module, so the directive is unnecessary AND would force the
      // entire spatial chunk into the client subgraph at the wrong
      // boundary.
      const file = resolve(distDir, 'spatial.js')
      expect(existsSync(file)).toBe(true)
      expect(startsWithUseClient(file)).toBe(false)
    })
  })
})
