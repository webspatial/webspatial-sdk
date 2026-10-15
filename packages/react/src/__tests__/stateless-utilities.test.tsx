// Stateless utility validation per spatial-lazy-load spec tasks.md §14.
//
// Group B (session-aware) and Group C (pure constants / re-exports) live in
// the default entry's static module graph and MUST function without
// `bootSpatial()` ever being called. These tests pin the graceful-degradation
// behavior across SSR / pre-boot / WebSpatial-runtime contexts so the
// "Stateless utility APIs and pure re-exports remain in the default entry"
// Requirement and the `runtime-capabilities` "Unsupported behavior contracts"
// Requirement (its hooks/utility-functions branch) cannot regress silently.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { convertCoordinate } from '../utils/convertCoordinate'
import { enableDebugTool } from '../utils/debugTool'
import { initScene } from '../initScene'
import { WebSpatialRuntime } from '../webSpatialRuntime'
import {
  resetRuntimeCacheForTests,
  WebSpatialRuntimeError,
} from '@webspatial/core-sdk/runtime'
import {
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  loadSpatialImpl,
  type SpatialImplementation,
} from '../runtime/bridge'
import { __resetBootStateForTests, bootSpatial } from '../runtime/boot'

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  })
}

function setPlainWebUserAgent(): void {
  setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36')
}

function setPuppeteerUserAgent(): void {
  setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')
}

function resetEnv(): void {
  vi.unstubAllGlobals()
  __resetSpatialBridgeForTests()
  __resetBootStateForTests()
  // Reset the local cached UA/runtime snapshot so each test sees the
  // freshly stubbed userAgent. Without this, supports() would observe the
  // first-test snapshot for the entire suite.
  resetRuntimeCacheForTests()
  setPlainWebUserAgent()
  // Strip diagnostic props the debug-tool tests inject onto window.
  if (typeof window !== 'undefined') {
    delete (window as any).inspectCurrentSpatialScene
    delete (window as any).getSpatialized2DElement
  }
}

beforeEach(() => {
  resetEnv()
})

afterEach(() => {
  resetEnv()
})

// `getAbsoluteUrl` was a Group C export in v1 and was removed in v2 — its
// behavioural contract is preserved in the internal helper at
// `src/internal/urlUtils.ts` (still used by `Texture.tsx` /
// `ModelAsset.tsx`); the colocated `src/internal/urlUtils.test.ts` suite
// pins the SSR-safe + relative-resolution + never-throw behaviour. No
// public-surface test belongs here.

// ---------------------------------------------------------------------------
// §14.1 initScene gracefully no-ops without bootSpatial / SSR
// ---------------------------------------------------------------------------

describe('initScene (spec tasks.md §14.1 + Group B "initScene" row)', () => {
  it('returns undefined without side effects when bootSpatial() has not resolved (pre-boot)', () => {
    const cb = vi.fn(pre => pre)
    const result = initScene('main', cb)
    expect(result).toBeUndefined()
    expect(cb).not.toHaveBeenCalled()
  })

  it('SSR-safe: under no-window, initScene resolves without throwing or scheduling work', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('navigator', undefined)
    const cb = vi.fn(pre => pre)
    expect(() => initScene('main', cb)).not.toThrow()
    expect(cb).not.toHaveBeenCalled()
  })

  it('routes to spatial-impl getSession when bootSpatial() has resolved (Path 2)', async () => {
    setPuppeteerUserAgent()
    const sceneSpy = vi.fn(() => 'scene-result')
    const sentinelImpl = {
      getSession: () => ({ initScene: sceneSpy }),
    } as unknown as SpatialImplementation
    __setSpatialImplLoaderForTests(() => Promise.resolve(sentinelImpl))
    await bootSpatial()

    const cb = vi.fn(pre => pre)
    const result = initScene('main', cb)

    expect(sceneSpy).toHaveBeenCalledTimes(1)
    expect(sceneSpy).toHaveBeenCalledWith('main', cb, undefined)
    expect(result).toBe('scene-result')
  })
})

// ---------------------------------------------------------------------------
// §14.2 convertCoordinate fail-fast when unsupported
// ---------------------------------------------------------------------------

describe('convertCoordinate (convert-coordinate-fail-fast + runtime-capabilities "convertCoordinate fail-fast" Scenarios)', () => {
  it('in plain web: throws WebSpatialRuntimeError', async () => {
    const position = { x: 1, y: 2, z: 3 }
    await expect(
      convertCoordinate(position, { from: window, to: window }),
    ).rejects.toBeInstanceOf(WebSpatialRuntimeError)
  })

  it('in plain web: throws WebSpatialRuntimeError for invalid refs', async () => {
    const position = { x: 0, y: 0, z: 0 }
    const garbageRef = { not: 'a valid ref' } as any
    await expect(
      convertCoordinate(position, { from: garbageRef, to: garbageRef }),
    ).rejects.toMatchObject({ capability: 'convertCoordinate' })
  })

  it('in WebSpatial runtime before boot: throws with bootSpatial guidance', async () => {
    setPuppeteerUserAgent()
    const position = { x: 1, y: 2, z: 3 }
    await expect(
      convertCoordinate(position, { from: window, to: window }),
    ).rejects.toThrow(/bootSpatial\(\)/)
  })
})

// ---------------------------------------------------------------------------
// §14.3 enableDebugTool is SSR-safe + attaches diagnostics in WebSpatial mode
// ---------------------------------------------------------------------------

describe('enableDebugTool (spec tasks.md §14.3 + Group B "enableDebugTool" row)', () => {
  it('SSR-safe: under no-window, enableDebugTool returns without throwing', async () => {
    vi.stubGlobal('window', undefined)
    expect(() => enableDebugTool()).not.toThrow()
  })

  it('attaches inspectCurrentSpatialScene + getSpatialized2DElement to window in browser', () => {
    enableDebugTool()
    expect(typeof (window as any).inspectCurrentSpatialScene).toBe('function')
    expect(typeof (window as any).getSpatialized2DElement).toBe('function')
  })

  it('inspectCurrentSpatialScene throws a descriptive bootSpatial-pointing error when called pre-boot', async () => {
    enableDebugTool()
    const fn = (window as any)
      .inspectCurrentSpatialScene as () => Promise<unknown>
    await expect(fn()).rejects.toThrow(/bootSpatial\(\)/)
  })

  it('inspectCurrentSpatialScene routes through the spatial-impl getSession after boot (Path 2)', async () => {
    setPuppeteerUserAgent()
    const inspectSpy = vi.fn(() => 'inspect-result')
    const sentinelImpl = {
      getSession: () => ({
        getSpatialScene: () => ({ inspect: inspectSpy }),
      }),
    } as unknown as SpatialImplementation
    __setSpatialImplLoaderForTests(() => Promise.resolve(sentinelImpl))
    await bootSpatial()

    enableDebugTool()
    const fn = (window as any)
      .inspectCurrentSpatialScene as () => Promise<unknown>
    const result = await fn()
    expect(inspectSpy).toHaveBeenCalledTimes(1)
    expect(result).toBe('inspect-result')
  })
})

// ---------------------------------------------------------------------------
// §14.4 WebSpatialRuntime.supports is independent of bootSpatial
// ---------------------------------------------------------------------------

describe('WebSpatialRuntime.supports (spec tasks.md §14.4 + Group C "supports" row)', () => {
  it('is callable synchronously without bootSpatial() and returns false for spatial keys in plain web', () => {
    // Plain Chrome UA is set in beforeEach; in this snapshot type === null,
    // and per runtime-capabilities "Spatial-dependent capabilities are false
    // in non-WebSpatial browsers" ADDED Requirement, every spatial key
    // resolves to false.
    expect(WebSpatialRuntime.supports('Model')).toBe(false)
    expect(WebSpatialRuntime.supports('Reality')).toBe(false)
  })

  it('returns true under Puppeteer UA without bootSpatial() (per "supports in puppeteer harness" Scenario)', () => {
    setPuppeteerUserAgent()
    expect(WebSpatialRuntime.supports('Model')).toBe(true)
    expect(WebSpatialRuntime.supports('Reality')).toBe(true)
  })

  it('does NOT trigger any dynamic import as a side effect of supports() calls', async () => {
    setPuppeteerUserAgent()
    const loader = vi.fn(() =>
      Promise.resolve({} as unknown as SpatialImplementation),
    )
    __setSpatialImplLoaderForTests(loader)

    WebSpatialRuntime.supports('Model')
    WebSpatialRuntime.supports('Reality')
    // Drain microtasks: if `supports` accidentally awaited the bridge, the
    // loader would have been called by now.
    await Promise.resolve()
    expect(loader).not.toHaveBeenCalled()

    // Sanity: the bridge IS reachable when explicitly asked.
    await loadSpatialImpl()
    expect(loader).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// §14.6 Group C type-only re-exports vanish at runtime
//
// Implemented as a behavioral assertion: type re-exports compile cleanly but
// have no runtime presence on the namespace object. The full build-output
// scan (against `dist/index.js`) lives alongside §14.6's published-shape
// fixture; this test is the source-side parity assertion.
// ---------------------------------------------------------------------------

describe('Group C type-only re-exports (spec tasks.md §14.6 + "Type-only re-exports vanish at runtime" Scenario)', () => {
  it('default entry namespace has no runtime values for type-only names', async () => {
    // Each of these names is `export type`-only in src/index.ts; importing
    // them as values MUST yield `undefined`.
    const sdk = await import('../index')
    const typeOnlyNames = [
      'SpatializedElementRef',
      'EntityRef',
      'ModelRef',
      'ModelProps',
      'CapabilityKey',
      'RealityProps',
      'SpatialTapEvent',
    ]
    for (const name of typeOnlyNames) {
      expect((sdk as Record<string, unknown>)[name]).toBeUndefined()
    }
  })

  it('default entry namespace DOES bind documented runtime values', async () => {
    const sdk = await import('../index')
    expect(typeof sdk.bootSpatial).toBe('function')
    expect(typeof sdk.isSpatialReady).toBe('function')
    expect(typeof sdk.useSpatialReady).toBe('function')
    expect(typeof sdk.useMetrics).toBe('function')
    expect(typeof sdk.WebSpatialRuntime).toBe('object')
    expect(typeof sdk.WebSpatialBootError).toBe('function')
  })
})
