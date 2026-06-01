import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { __resetBootStateForTests, bootSpatial } from '../runtime/boot'
import {
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  type SpatialImplementation,
} from '../runtime/bridge'
import { useMetrics } from './useMetrics'
import { useMetricsPlaceholder } from './useMetrics-placeholder'

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

describe('useMetrics placeholder', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    setPlainWebUserAgent()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
  })

  it('returns the documented 1/1360 ratio constants (per "useMetrics placeholder returns the documented fallback values" Scenario)', () => {
    const m = useMetricsPlaceholder()
    expect(m.pointToPhysical(0)).toBe(0)
    expect(m.pointToPhysical(1360)).toBe(1)
    expect(m.physicalToPoint(1)).toBe(1360)
  })

  it('exposes stable function identities across calls (per "useMetrics function identities are stable across renders" Scenario)', () => {
    const a = useMetricsPlaceholder()
    const b = useMetricsPlaceholder()
    expect(a).toBe(b)
    expect(a.pointToPhysical).toBe(b.pointToPhysical)
    expect(a.physicalToPoint).toBe(b.physicalToPoint)
  })

  it('placeholder singleton is frozen', () => {
    const m = useMetricsPlaceholder()
    expect(Object.isFrozen(m)).toBe(true)
  })
})

describe('useMetrics public hook (placeholder-vs-real selector)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    setPlainWebUserAgent()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
  })

  it('returns the placeholder when isSpatialReady() is false', () => {
    const { result } = renderHook(() => useMetrics())
    expect(result.current.pointToPhysical(1360)).toBe(1)
    expect(result.current.physicalToPoint(1)).toBe(1360)
  })

  it('keeps function identities stable across renders inside the same component instance', () => {
    const { result, rerender } = renderHook(() => useMetrics())
    const first = result.current
    rerender()
    rerender()
    rerender()
    expect(result.current).toBe(first)
    expect(result.current.pointToPhysical).toBe(first.pointToPhysical)
    expect(result.current.physicalToPoint).toBe(first.physicalToPoint)
  })

  it('renderToString returns the placeholder constants without touching window (per "useMetrics is SSR-safe" Scenario)', () => {
    function Probe() {
      const m = useMetrics()
      return <span>{m.pointToPhysical(1360)}</span>
    }
    const html = renderToString(<Probe />)
    expect(html).toContain('>1<')
  })

  it('does NOT switch implementations mid-life: a component that first invoked the placeholder keeps invoking the placeholder even after bootSpatial() resolves (per "Hook implementation does not switch mid-life" Scenario)', async () => {
    setPuppeteerUserAgent()
    // Sentinel "real" useMetrics that returns different (and detectable) values.
    const sentinelImpl = {
      useMetrics: () => ({
        pointToPhysical: (n: number) => n * 7,
        physicalToPoint: (n: number) => n * 11,
      }),
    } as unknown as SpatialImplementation
    __setSpatialImplLoaderForTests(() => Promise.resolve(sentinelImpl))

    const { result, rerender } = renderHook(() => useMetrics())
    // First render mounted while spatial was not ready ⇒ placeholder pinned for life.
    expect(result.current.pointToPhysical(1360)).toBe(1)

    await act(async () => {
      await bootSpatial()
    })
    rerender()

    // Despite isSpatialReady === true now, this instance keeps the placeholder.
    expect(result.current.pointToPhysical(1360)).toBe(1)
    expect(result.current.physicalToPoint(1)).toBe(1360)
  })

  it('a fresh instance after remount picks up the real implementation once boot has resolved (per "Remount picks up the real hook implementation" Scenario)', async () => {
    setPuppeteerUserAgent()
    const sentinelImpl = {
      useMetrics: () => ({
        pointToPhysical: (n: number) => n * 7,
        physicalToPoint: (n: number) => n * 11,
      }),
    } as unknown as SpatialImplementation
    __setSpatialImplLoaderForTests(() => Promise.resolve(sentinelImpl))

    await act(async () => {
      await bootSpatial()
    })

    const { result } = renderHook(() => useMetrics())
    expect(result.current.pointToPhysical(3)).toBe(21)
    expect(result.current.physicalToPoint(3)).toBe(33)
  })
})
