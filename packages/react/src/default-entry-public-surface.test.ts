import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as sdk from './index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const indexSource = readFileSync(resolve(__dirname, 'index.ts'), 'utf8')

describe('default-entry public surface (spec tasks.md §7.1 / §7.2 / §7.3 / §3.3)', () => {
  describe('Public runtime exports (per spec "Public API surface")', () => {
    // Runtime-value exports — these MUST resolve to a defined binding after
    // `import * as sdk from '@webspatial/react-sdk'`. Types-only exports are
    // erased at runtime and validated separately below via a source-level
    // check on `src/index.ts`.
    const requiredRuntimeExports = [
      // Lazy-load runtime
      'bootSpatial',
      'isSpatialReady',
      'useSpatialReady',
      'SpatialBoot',
      'onSpatialLoadError',
      'WebSpatialBootError',
      // Core infrastructure
      'WebSpatialRuntime',
      'WebSpatialRuntimeError',
      'enableDebugTool',
      'convertCoordinate',
      // `getAbsoluteUrl` was a Group C public export in v1 and was removed
      // in v2 (see the `remove-getabsoluteurl` changeset). The helper still
      // exists at `src/internal/urlUtils.ts` for internal consumers and is
      // tested colocated at `src/internal/urlUtils.test.ts`.
      // `SSRProvider` was a Group C public export until the
      // `remove-ssr-provider` change; hydration gating now lives in the
      // facade's `useSpatialReady` and real hosts mount post-hydration through
      // the facade delegate (no Context, no internal SSR wrapper).
      'initScene',
      // Spatial primitive facades
      'AttachmentEntity',
      'Box',
      'BoxEntity',
      'Cone',
      'ConeEntity',
      'Cylinder',
      'CylinderEntity',
      'Entity',
      'Model',
      'ModelEntity',
      'Plane',
      'PlaneEntity',
      'Reality',
      'SceneGraph',
      'Sphere',
      'SphereEntity',
      'AttachmentAsset',
      'Material',
      'ModelAsset',
      'Texture',
      'UnlitMaterial',
      'World',
      // `withSpatialMonitor` and `withSpatialized2DElementContainer` were
      // factory-style HOC public exports in v1 and were demoted to
      // internal-only in v2 (see the `internalize-hoc-factories`
      // changeset). The `<div enable-xr>` / `<div enable-xr-monitor>` JSX
      // markers remain the documented public mechanism; the factories
      // themselves live on at their original source paths and are
      // reached internally by the JSX runtime via
      // `src/internal/facades-client.ts`.
      // Hooks
      'useMetrics',
      'useAnimation',
      // Deprecated v1 export
      'createElement',
      // Constants
      'version',
    ] as const

    it.each(requiredRuntimeExports)('exports `%s`', name => {
      expect(name in sdk).toBe(true)
      expect((sdk as Record<string, unknown>)[name]).toBeDefined()
    })
  })

  describe('Removed internals (per proposal BREAKING bullet + spec tasks.md §3.3)', () => {
    // The four internal container / monitor constructors MUST be removed from
    // the public surface — they are facade-HOC implementation details and
    // user-facing exports route through `withSpatialized2DElementContainer` /
    // `withSpatialMonitor` facade HOCs instead.
    const removedInternals = [
      'SpatializedContainer',
      'Spatialized2DElementContainer',
      'SpatializedStatic3DElementContainer',
      'SpatialMonitor',
    ] as const

    it.each(removedInternals)('does NOT export `%s`', name => {
      expect(name in sdk).toBe(false)
    })

    // Internal reality hooks MUST NOT be part of the documented public API
    // (per spec tasks.md §5.3 / §7.1 — they ship inside the spatial chunk
    // alongside the components that consume them).
    const internalRealityHooks = [
      'useEntity',
      'useEntityRef',
      'useEntityTransform',
      'useEntityEvent',
      'useEntityId',
      'useRealityEvents',
      'useForceUpdate',
    ] as const

    it.each(internalRealityHooks)(
      'does NOT export internal reality hook `%s`',
      name => {
        expect(name in sdk).toBe(false)
      },
    )

    it('does NOT export internal boot hook `useBootSpatial`', () => {
      expect('useBootSpatial' in sdk).toBe(false)
    })

    // Other internals that were previously surfaced via `export *` and MUST
    // now stay inside the spatial chunk.
    const otherInternals = [
      'initPolyfill',
      'SpatialCustomStyleVars',
      'StandardSpatializedContainer',
      'PortalSpatializedContainer',
      'TransformVisibilityTaskContainer',
      'eventMap',
    ] as const

    it.each(otherInternals)('does NOT export internal `%s`', name => {
      expect(name in sdk).toBe(false)
    })
  })

  describe('Default-entry static module graph (spec tasks.md §7.3 — source-level check)', () => {
    // Per spec tasks.md §7.3: `no static import path from src/index.ts
    // reaches src/spatial/` and, since §3.1's physical file move is
    // staged after PR 4, the same prohibition applies to the existing
    // spatial implementation directories. Type-only re-exports / imports
    // are erased at runtime and remain permitted (the underlying file is
    // not pulled into the bundle's module graph).
    //
    // We assert this at the source level on `src/index.ts` only. A full
    // graph walk lives in `tasks.md §9.4` (identifier scan on the built
    // `dist/index.js`) which PR 5 wires into CI.

    // Strip comments before regex parsing so a path mentioned inside a
    // comment doesn't false-positive against the runtime-import rule.
    const stripComments = (src: string): string => {
      let stripped = src.replace(/\/\*[\s\S]*?\*\//g, '')
      stripped = stripped
        .split('\n')
        .map(line => line.replace(/(^|[^:])\/\/.*$/, '$1'))
        .join('\n')
      return stripped
    }

    const sourceNoComments = stripComments(indexSource)

    // Match `import` / `export ... from '...'` declarations, possibly
    // spanning multiple lines. The non-greedy `[\s\S]*?` between the
    // keyword and `from` covers both `{ a, b }` and `* as ns` forms while
    // stopping at the first `from '...'` clause.
    const declRe =
      /\b(import|export)\s+(type\s+)?([\s\S]*?)from\s+['"]([^'"]+)['"]/g

    const forbiddenRuntimePathPrefixes = [
      './Model',
      './reality',
      './spatialized-container',
      './spatialized-container-monitor',
      './useMetrics',
      './spatial',
      './notifyUpdateStandInstanceLayout',
    ]

    const findOffendingRuntimeImports = (): {
      keyword: string
      bindings: string
      path: string
    }[] => {
      const offenders: { keyword: string; bindings: string; path: string }[] =
        []
      let match: RegExpExecArray | null
      declRe.lastIndex = 0
      while ((match = declRe.exec(sourceNoComments)) !== null) {
        const [, keyword, typeKeyword, bindings, path] = match
        // Skip type-only re-exports / imports — TypeScript / esbuild
        // erase them and the underlying module is NOT pulled into the
        // runtime bundle's module graph.
        if (typeKeyword) continue
        for (const prefix of forbiddenRuntimePathPrefixes) {
          if (path === prefix || path.startsWith(prefix + '/')) {
            offenders.push({
              keyword,
              bindings: bindings.trim().replace(/\s+/g, ' '),
              path,
            })
            break
          }
        }
      }
      return offenders
    }

    it('contains NO runtime `import` / `export` from spatial implementation paths', () => {
      const offenders = findOffendingRuntimeImports()
      // If this test fails, the error message lists each offending
      // declaration so the PR author can either route the import through
      // a facade / runtime helper or convert it to a type-only re-export.
      expect(offenders).toEqual([])
    })

    it('contains NO top-level `initPolyfill` invocation (per spec tasks.md §7.2)', () => {
      const invokesPolyfill = /\binitPolyfill\s*\(/.test(sourceNoComments)
      expect(invokesPolyfill).toBe(false)
    })

    it('declares `version` exactly once', () => {
      const matches = sourceNoComments.match(/export const version\s*=/g) ?? []
      expect(matches.length).toBe(1)
    })
  })

  describe('Facade vs real-impl identity (PR 4 wires facades into default entry)', () => {
    it('the default-entry `Model` is the facade exported from `./facades`, not the real spatial Model', async () => {
      const facadeMod = await import('./facades/Model')
      expect((sdk as Record<string, unknown>).Model).toBe(facadeMod.Model)
    })

    // `withSpatialized2DElementContainer` and `withSpatialMonitor` USED to
    // be reachable on the default entry as facade-identity assertions; they
    // were demoted to internal-only in the `internalize-hoc-factories`
    // change (see this file's `requiredRuntimeExports` tombstone comment).
    // Internal-only callers (the JSX runtime via `src/internal/facades-client.ts`,
    // `parity.test.tsx`, `jsx-shared.test.tsx`) reach the facade files
    // directly, so identity is preserved internally; no public-surface
    // assertion belongs here.
    it('the default-entry `useMetrics` is the placeholder-or-real selector', async () => {
      const selectorMod = await import('./hooks-web/useMetrics')
      expect((sdk as Record<string, unknown>).useMetrics).toBe(
        selectorMod.useMetrics,
      )
    })

    it('the default-entry `useAnimation` is the ready-gated facade', async () => {
      const facadeMod = await import('./hooks-web/useAnimation')
      expect((sdk as Record<string, unknown>).useAnimation).toBe(
        facadeMod.useAnimation,
      )
    })

    it('the default-entry `useEntityAnimation` comes from the dedicated facade file', async () => {
      const facadeMod = await import('./hooks-web/useEntityAnimation')
      expect((sdk as Record<string, unknown>).useEntityAnimation).toBe(
        facadeMod.useEntityAnimation,
      )
    })
  })
})
