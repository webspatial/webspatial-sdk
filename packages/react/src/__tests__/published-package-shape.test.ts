import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Per spatial-lazy-load spec tasks.md §8.8 ("React peer is required (hard
// peer)" Scenario) and §9.5 ("Published package declares sideEffects:
// false" Scenario), validate the package.json that gets published to the
// registry. The publish pipeline does not rewrite the source
// `packages/react/package.json` (the `publish` step uploads it as-is), so we
// load it directly.

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = resolve(__dirname, '../../package.json')

type PackageJsonShape = {
  name?: string
  main?: string
  types?: string
  type?: string
  sideEffects?: boolean | readonly string[]
  exports?: Record<string, unknown>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

function loadPackageJson(): PackageJsonShape {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonShape
}

describe('packages/react/package.json — published shape (spec tasks.md §8.7 / §8.8 / §9.5)', () => {
  describe('Hard React peer dependency (§8.7 + §8.8 — "React peer is required" Scenario)', () => {
    it('declares peerDependencies.react as ">=18.0" (or stricter constraint matching the same baseline)', () => {
      const pkg = loadPackageJson()
      expect(pkg.peerDependencies?.react).toBeDefined()
      // Spec task §8.7 pins ">=18.0" exactly. Tighter constraints
      // (e.g. ">=18.0.0", ">=18.2") would also satisfy the contract, but
      // the spec literal is the authoritative pin so the test asserts the
      // exact string.
      expect(pkg.peerDependencies?.react).toBe('>=18.0')
    })

    it('declares peerDependencies["react-dom"] as ">=18.0"', () => {
      const pkg = loadPackageJson()
      expect(pkg.peerDependencies?.['react-dom']).toBeDefined()
      expect(pkg.peerDependencies?.['react-dom']).toBe('>=18.0')
    })

    it('peerDependenciesMeta.react.optional is NOT true (hard peer)', () => {
      const pkg = loadPackageJson()
      // Per the "React peer is required (hard peer)" Scenario the optional
      // flag MUST be false (or the entry MUST be absent — npm/pnpm/yarn
      // default is false). Either form passes.
      const optional = pkg.peerDependenciesMeta?.react?.optional
      expect(optional === true).toBe(false)
    })

    it('peerDependenciesMeta["react-dom"].optional is NOT true (hard peer)', () => {
      const pkg = loadPackageJson()
      const optional = pkg.peerDependenciesMeta?.['react-dom']?.optional
      expect(optional === true).toBe(false)
    })
  })

  describe('Tree-shake friendliness (§9.5 — "Published package declares sideEffects: false" Scenario)', () => {
    it('declares the top-level "sideEffects" field', () => {
      const pkg = loadPackageJson()
      expect(pkg.sideEffects).toBeDefined()
    })

    it('"sideEffects" is literally `false` OR a precise allow-list array (NOT `true`)', () => {
      const pkg = loadPackageJson()
      const sideEffects = pkg.sideEffects
      const isExplicitlyFalse = sideEffects === false
      const isAllowList =
        Array.isArray(sideEffects) &&
        sideEffects.every(entry => typeof entry === 'string')
      expect(isExplicitlyFalse || isAllowList).toBe(true)
    })

    it('"sideEffects" is NOT `true` (would defeat consumer-bundler tree-shaking)', () => {
      const pkg = loadPackageJson()
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      expect(pkg.sideEffects === true).toBe(false)
    })
  })

  describe('Lazy-load v1 published exports (§8.3 / §8.4)', () => {
    it('main + types + module type point at the new flat dist/ layout', () => {
      const pkg = loadPackageJson()
      expect(pkg.main).toBe('./dist/index.js')
      expect(pkg.types).toBe('./dist/index.d.ts')
      expect(pkg.type).toBe('module')
    })

    it('exports["."] resolves to dist/index.js', () => {
      const pkg = loadPackageJson()
      const root = pkg.exports?.['.'] as Record<string, string> | string
      const file = typeof root === 'string' ? root : root?.default
      expect(file).toBe('./dist/index.js')
    })

    it('exports["./spatial"] resolves to dist/spatial.js (bridge dynamic-import target)', () => {
      const pkg = loadPackageJson()
      const sub = pkg.exports?.['./spatial'] as
        | Record<string, string>
        | string
        | undefined
      const file = typeof sub === 'string' ? sub : sub?.default
      expect(file).toBe('./dist/spatial.js')
    })

    it('exports["./jsx-runtime"] is a single mapping (NO `react-server` conditional)', () => {
      const pkg = loadPackageJson()
      const sub = pkg.exports?.['./jsx-runtime'] as
        | Record<string, string>
        | string
        | undefined
      expect(sub).toBeDefined()
      if (typeof sub === 'object' && sub !== null) {
        expect((sub as Record<string, unknown>)['react-server']).toBeUndefined()
      }
      const file = typeof sub === 'string' ? sub : sub?.default
      expect(file).toBe('./dist/jsx/jsx-runtime.js')
    })

    it('exports["./jsx-dev-runtime"] is a single mapping (NO `react-server` conditional)', () => {
      const pkg = loadPackageJson()
      const sub = pkg.exports?.['./jsx-dev-runtime'] as
        | Record<string, string>
        | string
        | undefined
      expect(sub).toBeDefined()
      if (typeof sub === 'object' && sub !== null) {
        expect((sub as Record<string, unknown>)['react-server']).toBeUndefined()
      }
      const file = typeof sub === 'string' ? sub : sub?.default
      expect(file).toBe('./dist/jsx/jsx-dev-runtime.js')
    })

    it('legacy /web and /default subpaths are HARD-REMOVED', () => {
      const pkg = loadPackageJson()
      expect(pkg.exports?.['./web']).toBeUndefined()
      expect(pkg.exports?.['./default']).toBeUndefined()
      expect(pkg.exports?.['./web/jsx-runtime']).toBeUndefined()
      expect(pkg.exports?.['./web/jsx-dev-runtime']).toBeUndefined()
      expect(pkg.exports?.['./default/jsx-runtime']).toBeUndefined()
      expect(pkg.exports?.['./default/jsx-dev-runtime']).toBeUndefined()
    })

    it('does NOT export a ./server subpath (deferred until product needs RSC helpers)', () => {
      const pkg = loadPackageJson()
      expect(pkg.exports?.['./server']).toBeUndefined()
    })

    it('exports["./runtime"] on @webspatial/core-sdk resolves to dist/runtime/index.js', () => {
      const corePkgPath = resolve(__dirname, '../../../core/package.json')
      const corePkg = JSON.parse(readFileSync(corePkgPath, 'utf8')) as {
        exports?: Record<string, unknown>
      }
      const sub = corePkg.exports?.['./runtime'] as
        | Record<string, string>
        | string
        | undefined
      expect(sub).toBeDefined()
      const file = typeof sub === 'string' ? sub : sub?.import ?? sub?.default
      expect(file).toBe('./dist/runtime/index.js')
    })
  })
})
