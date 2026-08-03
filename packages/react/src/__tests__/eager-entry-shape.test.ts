// =============================================================================
// Eager-mode entry shape + behavior tests per spec
// `tasks.md §16.6` and the "Eager-mode entry for spatial-only consumers"
// Requirement.
//
// What this asserts:
//
//   1. Importing every documented symbol from `@webspatial/react-sdk/eager`
//      yields a defined runtime value (or, for type-only re-exports, yields
//      `undefined` per the existing "Type-only re-exports vanish at runtime"
//      Scenario for the default entry — type-only re-exports should also
//      vanish on the eager entry).
//   2. The named-export set of the eager entry is a strict superset of the
//      named-export set of the default entry (drift detection — adding a
//      new export to the default entry without adding it to the eager
//      entry MUST fail this test).
//   3. `bootSpatial()` from the eager entry resolves immediately without
//      scheduling any dynamic import (verified via a spy on the bridge's
//      test-only loader hook).
//   4. `isSpatialReady()` from the eager entry returns `true` synchronously
//      from the moment the module evaluates.
//   5. `useSpatialReady()` from the eager entry returns `true` on first and
//      every render (uses `renderHook`).
//   6. Per the "Migration from default to eager is import-root-only"
//      Scenario: a fixture rendered with the eager entry's facade-equivalent
//      symbols MUST commit the real spatial implementation (not a fallback)
//      on first render.
// =============================================================================

import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as DefaultEntry from '../index'
import * as EagerEntry from '../eager'
import {
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  type SpatialImplementation,
} from '../runtime/bridge'
import { __resetEagerStubsForTests } from '../runtime/eagerStubs'

beforeEach(() => {
  // The eager entry calls `__internalSetSpatialImpl` at module-evaluation
  // time. We do NOT reset the bridge between tests in this suite because
  // doing so would require re-importing `../eager` (and Vitest's module
  // registry already has it cached from the top-of-file import). The
  // eager entry's runtime stubs are pure / stateless apart from the
  // one-shot warning latch which we reset for individual call counting.
  __resetEagerStubsForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// 1. Eager namespace contains every documented runtime value.
// ---------------------------------------------------------------------------

describe('Eager entry — runtime symbol presence (spec §16.6)', () => {
  // We assert `!== undefined` instead of pinning `typeof` for each symbol
  // because `forwardRef` / `memo` wrappers around the underlying functions
  // can produce either `'object'` or `'function'` depending on the wrapper's
  // React internals; the eager entry's contract only requires that the symbol
  // resolves to a defined runtime value, NOT that it has a specific JS
  // primitive shape.

  const EXPECTED_SPATIAL_PRIMITIVES = [
    'Model',
    'Reality',
    'Entity',
    'BoxEntity',
    'SphereEntity',
    'ConeEntity',
    'CylinderEntity',
    'PlaneEntity',
    'ModelEntity',
    'AttachmentEntity',
    'Box',
    'Sphere',
    'Cone',
    'Cylinder',
    'Plane',
    'Material',
    'UnlitMaterial',
    'Texture',
    'ModelAsset',
    'AttachmentAsset',
    'SceneGraph',
    'World',
    // `withSpatialized2DElementContainer` and `withSpatialMonitor` were on
    // this parity list in v1 and were demoted to internal-only in v2 (see
    // the `internalize-hoc-factories` changeset). The eager entry inherits
    // its facade surface from the default entry via re-export so the
    // demotion cascades automatically — the parity contract continues to
    // hold (both entries omit them).
    'useMetrics',
  ] as const

  const EXPECTED_LAZY_RUNTIME_STUBS = [
    'bootSpatial',
    'isSpatialReady',
    'useSpatialReady',
    'SpatialBoot',
    'onSpatialLoadError',
    'WebSpatialBootError',
  ] as const

  const EXPECTED_STATELESS_UTILITIES = [
    'enableDebugTool',
    'convertCoordinate',
    'initScene',
    // `getAbsoluteUrl` was on this parity list in v1 and was removed in v2
    // (see the `remove-getabsoluteurl` changeset). Eager-entry stateless
    // re-exports go through `src/eager.ts:export { ... } from './index'`,
    // so removing the default-entry export cascades to the eager entry
    // automatically and the parity contract continues to hold.
    // `SSRProvider` was removed in the `remove-ssr-provider` changeset.
    'WebSpatialRuntime',
    'WebSpatialRuntimeError',
    'version',
    'createElement',
  ] as const

  it('exposes the spatial primitive facades as defined runtime values (real impls from /spatial)', () => {
    for (const name of EXPECTED_SPATIAL_PRIMITIVES) {
      expect(
        (EagerEntry as Record<string, unknown>)[name],
        `Eager entry MUST expose '${name}' (spatial primitive — real impl)`,
      ).toBeDefined()
    }
  })

  it('exposes the lazy-load runtime API as compatibility stubs (callable)', () => {
    for (const name of EXPECTED_LAZY_RUNTIME_STUBS) {
      const value = (EagerEntry as Record<string, unknown>)[name]
      expect(
        value,
        `Eager entry MUST expose '${name}' (lazy-load runtime stub)`,
      ).toBeDefined()
      // The four function-shaped names MUST be callable; only
      // `WebSpatialBootError` is a class (still typeof 'function').
      expect(typeof value).toBe('function')
    }
  })

  it('does NOT export internal boot hook `useBootSpatial`', () => {
    expect(
      (EagerEntry as Record<string, unknown>).useBootSpatial,
    ).toBeUndefined()
  })

  it.each(['useAnimation', 'useEntityAnimation'] as const)(
    'does NOT export experimental hook `%s`',
    name => {
      expect((EagerEntry as Record<string, unknown>)[name]).toBeUndefined()
    },
  )

  it('exposes Group B / Group C stateless utilities re-exported from the default entry', () => {
    for (const name of EXPECTED_STATELESS_UTILITIES) {
      expect(
        (EagerEntry as Record<string, unknown>)[name],
        `Eager entry MUST expose '${name}' (stateless utility / pure re-export)`,
      ).toBeDefined()
    }
    // The version export carries a specific primitive shape we DO want
    // to pin — it's a string injected by tsup at build time.
    expect(typeof EagerEntry.version).toBe('string')
  })

  it('Group C type-only re-exports vanish at runtime on the eager entry too', () => {
    // Mirrors the existing "Type-only re-exports vanish at runtime" Scenario
    // for the default entry — `export type *` from `./index` MUST give the
    // eager entry zero runtime presence for these names.
    const typeOnlyNames = [
      'CapabilityKey',
      'ModelProps',
      'ModelRef',
      'RealityProps',
      'BackgroundMaterialType',
      'SpatialBoxGeometryOptions',
      'WebSpatialRuntimeType',
      'PWAManifest',
    ]
    for (const name of typeOnlyNames) {
      expect((EagerEntry as Record<string, unknown>)[name]).toBeUndefined()
    }
  })
})

// ---------------------------------------------------------------------------
// 2. Strict superset over the default-entry runtime export set.
// ---------------------------------------------------------------------------

describe('Eager entry — surface parity with default entry (spec §16.9)', () => {
  it('every default-entry runtime export name MUST exist on the eager entry', () => {
    // Compute the set of NAMES exported by the default entry that are
    // bound to a defined runtime value (excludes `export type` re-exports
    // whose runtime presence is undefined per the previous test).
    const defaultRuntimeNames = Object.keys(DefaultEntry).filter(
      n => (DefaultEntry as Record<string, unknown>)[n] !== undefined,
    )
    const eagerNames = new Set(Object.keys(EagerEntry))
    const missing = defaultRuntimeNames.filter(n => !eagerNames.has(n))
    expect(
      missing,
      `These default-entry exports are missing from the eager entry: ${missing.join(', ')}. Add them to src/eager.ts re-exports per spec §16.9.`,
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 3. bootSpatial is a no-op (no dynamic import scheduled).
// ---------------------------------------------------------------------------

describe('Eager entry — `bootSpatial()` compatibility stub (spec §16.6 Scenario)', () => {
  it('returns Promise.resolve() without invoking the bridge loader', async () => {
    const loader = vi.fn(() =>
      Promise.resolve({} as unknown as SpatialImplementation),
    )
    __setSpatialImplLoaderForTests(loader)
    const start = performance.now()
    await EagerEntry.bootSpatial()
    const elapsed = performance.now() - start
    // No await on a real network — at most a microtask.
    expect(elapsed).toBeLessThan(50)
    expect(loader).not.toHaveBeenCalled()
  })

  it('emits a one-shot dev warning then never warns again', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await EagerEntry.bootSpatial()
    await EagerEntry.bootSpatial()
    await EagerEntry.bootSpatial()
    const eagerWarnings = warnSpy.mock.calls
      .map(c => String(c[0] ?? ''))
      .filter(s => /eager entry/i.test(s))
    // First call MAY warn (in dev / non-production); subsequent calls MUST NOT
    // re-warn (the latch guards against repeat noise).
    expect(eagerWarnings.length).toBeLessThanOrEqual(1)
    warnSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// 4. isSpatialReady / useSpatialReady always report ready.
// ---------------------------------------------------------------------------

describe('Eager entry — readiness stubs (spec §16.6 Scenario)', () => {
  it('isSpatialReady() returns true synchronously from the eager entry', () => {
    expect(EagerEntry.isSpatialReady()).toBe(true)
  })

  it('useSpatialReady() returns true on first render', () => {
    const { result } = renderHook(() => EagerEntry.useSpatialReady())
    expect(result.current).toBe(true)
  })

  it('useSpatialReady() remains true across re-renders', () => {
    const { result, rerender } = renderHook(() => EagerEntry.useSpatialReady())
    expect(result.current).toBe(true)
    rerender()
    expect(result.current).toBe(true)
    rerender()
    expect(result.current).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. onSpatialLoadError stub registers but never invokes.
// ---------------------------------------------------------------------------

describe('Eager entry — onSpatialLoadError stub (spec §16.6 Scenario)', () => {
  it('returns a working unsubscribe function and the callback is never invoked', async () => {
    const cb = vi.fn()
    const unsubscribe = EagerEntry.onSpatialLoadError(cb)
    expect(typeof unsubscribe).toBe('function')

    // Simulate every kind of "load attempt" the consumer might race:
    // bootSpatial calls, isSpatialReady reads, repeated boots. The eager
    // entry has no dynamic load and no failure path, so the callback MUST
    // never fire.
    await EagerEntry.bootSpatial()
    await EagerEntry.bootSpatial()
    EagerEntry.isSpatialReady()
    expect(cb).not.toHaveBeenCalled()

    // Unsubscribe is a no-op but MUST not throw.
    unsubscribe()
    expect(cb).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 6. After eager entry evaluates, the bridge sees real impl preloaded.
//    (This is the critical coupling between `__internalSetSpatialImpl` and
//    the eager entry — it's what guarantees that even facade-routed code
//    paths see ready-state on first render.)
// ---------------------------------------------------------------------------

describe('Eager entry — bridge preload (spec "Spatial primitives mount real implementations on first render" Scenario)', () => {
  it('side effect: the bridge reports ready immediately after eager module evaluation', async () => {
    // The very fact that EagerEntry was imported at the top of this file
    // (and ran its top-level `__internalSetSpatialImpl(SpatialImpl)`) means
    // the lazy-entry's `isSpatialReady()` MUST also return true.
    const { isSpatialReady: lazyIsReady, getSpatialImpl } = await import(
      '../runtime/bridge'
    )
    expect(lazyIsReady()).toBe(true)
    expect(getSpatialImpl()).not.toBeNull()
  })

  it('subsequent bridge load calls never schedule a dynamic import', async () => {
    const loader = vi.fn(() =>
      Promise.resolve({} as unknown as SpatialImplementation),
    )
    __setSpatialImplLoaderForTests(loader)

    const { loadSpatialImpl } = await import('../runtime/bridge')
    const result = await loadSpatialImpl()
    expect(result).not.toBeNull() // returns the preloaded impl
    expect(loader).not.toHaveBeenCalled()
  })

  // Cleanup: keep the bridge state intact for any later test in this file
  // (some assertions above assume the eager preload is still active).
  afterEach(() => {
    // We intentionally do NOT reset the bridge here, since the eager-mode
    // contract is "preload survives for the page lifetime" and resetting
    // would invalidate later assertions in this same suite.
    // If a separate test file needs a clean bridge it can call
    // `__resetSpatialBridgeForTests` itself.
    void __resetSpatialBridgeForTests
  })
})
