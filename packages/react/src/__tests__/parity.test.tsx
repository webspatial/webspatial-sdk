// Facade ↔ real-impl unsupported-branch parity per spatial-lazy-load spec
// tasks.md §15 and the "Two-scenario behavior contract audit" in
// `openspec/changes/lazy-load-spatial-runtime/REVIEW.md`.
//
// The harness mounts each Group A facade in two contexts:
//
//   - **Path 1** — the boot-bundle facade fallback (default entry).
//     Rendered with the spatial bridge unready (`isSpatialReady() === false`).
//     This branch is pinned by `spec.md` "Component facades" / "Hook
//     placeholders" Requirements.
//
//   - **Path 2** — the spatial-chunk real implementation's unsupported
//     branch. Rendered with the real spatial-chunk module loaded but the
//     underlying capability gate returning `false` (e.g. `<Model>` with
//     `enable-xr={false}` so `Spatial.runInSpatialWeb()` is bypassed).
//     This branch is pinned by `runtime-capabilities` "Unsupported
//     behavior contracts" Requirement.
//
// The two paths MUST produce structurally identical observable behavior;
// if they drift, this test catches the regression. Where a Path 2 fallback
// is NOT yet pinned (`SceneGraph`, HOC wrappers; or where the current real-
// impl needs to catch up to the documented contract — e.g. `Reality`,
// `BoxEntity`, ...), the parity test is recorded as `it.todo` with an
// explicit reference to the §15.8 follow-up so the gap doesn't disappear
// from the project radar.

import React from 'react'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Model as ModelFacade } from '../facades/Model'
import { Model as ModelReal } from '../Model'
import { useMetricsPlaceholder } from '../hooks-web/useMetrics-placeholder'
import { useMetrics as useMetricsReal } from '../useMetrics'
import { resetRuntimeCacheForTests } from '@webspatial/core-sdk/runtime'
import {
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  type SpatialImplementation,
} from '../runtime/bridge'
import { __resetBootStateForTests, bootSpatial } from '../runtime/boot'
import { __resetBootForgottenWarningForTests } from '../facades/shared/warnBootForgotten'
import {
  normalizeHtml,
  renderClientMarkup,
  renderStatic,
} from './helpers/parity'

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  })
}

function setPlainWebUserAgent(): void {
  setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36')
}

function resetEnv(): void {
  vi.unstubAllGlobals()
  __resetSpatialBridgeForTests()
  __resetBootStateForTests()
  __resetBootForgottenWarningForTests()
  resetRuntimeCacheForTests()
  setPlainWebUserAgent()
}

beforeEach(() => {
  resetEnv()
})

afterEach(() => {
  resetEnv()
})

// ---------------------------------------------------------------------------
// §15.3 — Model parity (Path 1: Model fallback / Path 2: runInSpatialWeb()
// false branch in real Model)
// ---------------------------------------------------------------------------

describe('Model parity (spec tasks.md §15.3 + REVIEW.md "Two-scenario behavior contract audit")', () => {
  it('Path 1 (facade fallback) and Path 2 (real Model with enable-xr={false}) produce structurally identical HTML', () => {
    const props = {
      src: 'x.usdz',
      style: { width: 100, height: 200 },
      className: 'parity-host',
    }
    // Path 1 — facade renders fallback because the bridge is not ready in
    // plain web; the facade strips spatial-only event props and emits the
    // shared React-safe Model fallback element.
    const path1 = renderClientMarkup(<ModelFacade {...props} />)

    // Path 2 — real Model with `enable-xr={false}` (or under non-WebSpatial
    // UA). Both gating paths short-circuit to the same degraded Model fallback
    // branch. Use client render to match how the real `Model` is mounted in
    // practice — a fresh post-hydration client mount via the facade delegate
    // (see `helpers/parity.renderClientMarkup`).
    const path2 = renderClientMarkup(<ModelReal {...props} />)

    expect(normalizeHtml(path1)).toBe(normalizeHtml(path2))
  })

  it('Path 1 and Path 2 strip the same set of spatial-only event props before reaching the fallback host', () => {
    const handler = () => {}
    const props: Record<string, unknown> = {
      src: 'y.usdz',
      onSpatialTap: handler,
      onSpatialDragStart: handler,
      onSpatialDrag: handler,
      onSpatialDragEnd: handler,
      onSpatialRotate: handler,
      onSpatialRotateEnd: handler,
      onSpatialMagnify: handler,
      onSpatialMagnifyEnd: handler,
      spatialEventOptions: { constrainedToAxis: [0, 1, 0] },
    }
    const path1 = renderClientMarkup(<ModelFacade {...(props as any)} />)
    const path2 = renderClientMarkup(<ModelReal {...(props as any)} />)

    for (const stripped of [
      'onspatialtap',
      'onspatialdragstart',
      'onspatialdrag',
      'onspatialdragend',
      'onspatialrotate',
      'onspatialrotateend',
      'onspatialmagnify',
      'onspatialmagnifyend',
      'spatialeventoptions',
    ]) {
      expect(path1.toLowerCase()).not.toContain(stripped)
      expect(path2.toLowerCase()).not.toContain(stripped)
    }
  })

  it('Both paths preserve the public displayName "Model"', () => {
    expect(ModelFacade.displayName).toBe('Model')
    expect(ModelReal.displayName).toBe('Model')
  })
})

// ---------------------------------------------------------------------------
// §15.4 — useMetrics parity (Path 1: placeholder throws in plain web /
// Path 2: real useMetrics under non-WebSpatial / no-session conditions still
// returns the 1/1360 ratio from PhysicalMetrics)
// ---------------------------------------------------------------------------

describe('useMetrics parity (spec tasks.md §15.4 + runtime-capabilities "useMetrics graceful degradation" Scenario)', () => {
  it('Path 1 (placeholder) throws on conversion in plain web with stable function identities', () => {
    const m1 = useMetricsPlaceholder()
    const m2 = useMetricsPlaceholder()
    expect(() => m1.pointToPhysical(1360)).toThrow()
    expect(() => m1.physicalToPoint(1)).toThrow()
    expect(m1).toBe(m2)
    expect(m1.pointToPhysical).toBe(m2.pointToPhysical)
    expect(m1.physicalToPoint).toBe(m2.physicalToPoint)
  })

  it('Path 2 (real useMetrics) under no-session conditions still returns the 1/1360 PhysicalMetrics fallback when invoked directly', () => {
    // Without a SpatialSession, the real useMetrics implementation reaches
    // its own no-runtime fallback branch. We mount it via renderHook in
    // jsdom (NOT SSR — the real `useMetrics` is missing `getServerSnapshot`,
    // which is a separate spec gap NOT in PR 6's scope; SSR safety of the
    // real hook is owned by the §13 SSR Requirement and the spec's
    // "useMetrics is SSR-safe" Scenario already pins the correct contract
    // on the placeholder, which is what the public default-entry hook
    // actually invokes during SSR per the per-instance selector).
    const { result } = renderHook(() => useMetricsReal())
    expect(result.current.pointToPhysical(0)).toBe(0)
    expect(result.current.pointToPhysical(1360)).toBe(1)
    expect(result.current.physicalToPoint(1)).toBe(1360)
  })
})

// ---------------------------------------------------------------------------
// §15.5 — Console-warning differential test (Path 1 silent in plain web /
// Path 2 may warn in WebSpatial runtime)
// ---------------------------------------------------------------------------

describe('Console-warning policy differential (spec tasks.md §15.5)', () => {
  it("Path 1 in plain web is SILENT — the facade fallback IS the user's final intended display", () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderStatic(
      <>
        <ModelFacade src="x.usdz" />
      </>,
    )
    // We only care that the SDK does NOT log boot-was-forgotten / capability
    // diagnostics in plain-web mode.
    const sdkWarnings = warnSpy.mock.calls
      .map(c => String(c[0] ?? ''))
      .filter(s => /WebSpatial|bootSpatial|spatial chunk/i.test(s))
    expect(sdkWarnings).toEqual([])
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('Path 2 in WebSpatial runtime is allowed to emit at most ONE console.warn per affected API per page', async () => {
    setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')
    __setSpatialImplLoaderForTests(() =>
      Promise.resolve({} as unknown as SpatialImplementation),
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Render TWO facades pre-boot in spatial UA — the SDK MUST NOT emit
    // more than one boot-forgotten warning per page lifetime.
    renderStatic(
      <>
        <ModelFacade src="x.usdz" />
        <ModelFacade src="y.usdz" />
      </>,
    )
    const bootWarnings = warnSpy.mock.calls
      .map(c => String(c[0] ?? ''))
      .filter(s => /bootSpatial/i.test(s))
    expect(bootWarnings.length).toBeLessThanOrEqual(1)
    warnSpy.mockRestore()
    // Drain bootSpatial cleanup
    await bootSpatial().catch(() => {})
  })
})

// ---------------------------------------------------------------------------
// §15.3 cont. — parity tests for components whose Path 2 either (a) is not
// pinned by the current `runtime-capabilities` spec, or (b) is pinned but
// the real-impl branch needs to catch up. Tracked under §15.8 as an
// OpenSpec follow-up; surfaced here as `it.todo` so the gap stays visible
// in the test suite output.
// ---------------------------------------------------------------------------

describe('Parity gaps tracked under spec tasks.md §15.8 (OpenSpec follow-up)', () => {
  // Path 2 IS pinned by `runtime-capabilities` "Reality unsupported
  // fallback" Scenario (`<div aria-hidden="true">` placeholder, layout
  // box preserved). The current real `Reality` implementation does NOT
  // render this placeholder; it relies on `getSession()` returning null
  // and silently mounts nothing. This is a real-impl drift the parity
  // harness would catch — opening a follow-up to align the real-impl
  // with its own spec is the right call.
  it.todo(
    'Reality parity — real-impl does NOT render the documented <div aria-hidden> placeholder; align via §15.8 follow-up',
  )

  // Path 2 IS pinned by `runtime-capabilities` "Unsupported HTML
  // component rendering" Scenario ("MUST not render corresponding
  // DOM/entity node"). Real `BoxEntity` / `SphereEntity` / etc. throw
  // on `useRealityContext()!.session` when no Reality parent is
  // present, instead of gracefully returning null. Parity test would
  // surface this; align via §15.8 follow-up.
  it.todo(
    'Entity-class parity (Box/Sphere/Cone/Cylinder/Plane/Model/AttachmentEntity) — real-impl throws on missing Reality context instead of rendering null; align via §15.8 follow-up',
  )

  it.todo(
    'Material / Texture / *Asset parity — same as Entity-class; align via §15.8 follow-up',
  )

  // Path 2 NOT pinned by `runtime-capabilities` today. The parity
  // contract SHOULD assert real-impl matches the facade's transparent
  // <>{children}</> fallback (per §15.3 bullet); requires a spec
  // amendment OR a real-impl unsupported-branch addition. Tracked
  // under §15.8.
  it.todo(
    'SceneGraph / World parity — Path 2 unpinned in `runtime-capabilities`; needs spec amendment under §15.8',
  )

  // `withSpatialized2DElementContainer` / `withSpatialMonitor` USED to have
  // a §15.8 parity gap (Path 2 unpinned in `runtime-capabilities`). Both
  // HOC factories were demoted to internal-only in the
  // `internalize-hoc-factories` change, so the parity contract no longer
  // applies — they are no longer public APIs that the SDK promises a
  // documented unsupported-branch contract for. The JSX runtime still
  // reaches them via `src/internal/facades-client.ts`; the parity of the
  // resulting JSX output for `<div enable-xr>` is covered by the
  // `jsx-shared.test.tsx` "JSX call sites" suite.
})
