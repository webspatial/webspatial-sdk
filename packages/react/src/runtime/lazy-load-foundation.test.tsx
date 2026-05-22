import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __getSpatialLoadAttemptForTests,
  __getSpatialReadySubscriberCountForTests,
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  loadSpatialImpl,
  onSpatialLoadError,
  type SpatialImplementation,
} from './bridge'
import { __resetBootStateForTests, bootSpatial } from './boot'
import { detectSpatialRuntime } from './detect'
import { WebSpatialBootError } from './errors'
import { useSpatialReady } from './useSpatialReady'

const spatialImpl = {} as SpatialImplementation

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

describe('lazy-load runtime foundation', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    setPlainWebUserAgent()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
  })

  it('detectSpatialRuntime is SSR safe and returns null without window', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('navigator', undefined)

    expect(detectSpatialRuntime()).toBeNull()
  })

  it('detectSpatialRuntime detects Puppeteer as a WebSpatial runtime', () => {
    setPuppeteerUserAgent()

    expect(detectSpatialRuntime()).toBe('puppeteer')
  })

  it('SSR/no-window bootSpatial does not schedule a dynamic import', async () => {
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('navigator', undefined)

    await bootSpatial()

    expect(loader).not.toHaveBeenCalled()
    expect(__getSpatialLoadAttemptForTests()).toBe(0)
  })

  it('non-WebSpatial browser bootSpatial is a no-op', async () => {
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)

    await bootSpatial()

    expect(loader).not.toHaveBeenCalled()
    expect(__getSpatialLoadAttemptForTests()).toBe(0)
  })

  it('Puppeteer runtime bootSpatial schedules the spatial import', async () => {
    setPuppeteerUserAgent()
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)

    await bootSpatial()

    expect(loader).toHaveBeenCalledTimes(1)
    expect(__getSpatialLoadAttemptForTests()).toBe(1)
  })

  it('loadSpatialImpl resolves null and skips loader in plain web', async () => {
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)

    await expect(loadSpatialImpl()).resolves.toBeNull()
    expect(loader).not.toHaveBeenCalled()
    expect(__getSpatialLoadAttemptForTests()).toBe(0)
  })

  it('loadSpatialImpl resolves null and skips loader without window (SSR)', async () => {
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('navigator', undefined)

    await expect(loadSpatialImpl()).resolves.toBeNull()
    expect(loader).not.toHaveBeenCalled()
    expect(__getSpatialLoadAttemptForTests()).toBe(0)
  })

  it('concurrent spatial loads share one promise and one loader attempt', async () => {
    setPuppeteerUserAgent()
    let resolveLoad!: (impl: SpatialImplementation) => void
    const loaderPromise = new Promise<SpatialImplementation>(resolve => {
      resolveLoad = resolve
    })
    const loader = vi.fn(() => loaderPromise)
    __setSpatialImplLoaderForTests(loader)

    const first = loadSpatialImpl()
    const second = loadSpatialImpl()

    expect(first).toBe(second)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(__getSpatialLoadAttemptForTests()).toBe(1)

    resolveLoad(spatialImpl)
    await expect(first).resolves.toBe(spatialImpl)
    await expect(second).resolves.toBe(spatialImpl)
  })

  it('failed imports are wrapped in WebSpatialBootError', async () => {
    setPuppeteerUserAgent()
    const cause = new Error('chunk failed')
    __setSpatialImplLoaderForTests(() => Promise.reject(cause))

    await expect(loadSpatialImpl()).rejects.toMatchObject({
      name: 'WebSpatialBootError',
      cause,
      attempt: 1,
    })
    await expect(loadSpatialImpl()).rejects.toBeInstanceOf(WebSpatialBootError)
  })

  it('retry after failure schedules a fresh attempt and increments attempt', async () => {
    setPuppeteerUserAgent()
    __setSpatialImplLoaderForTests(() =>
      Promise.reject(new Error('chunk failed')),
    )

    await expect(loadSpatialImpl()).rejects.toMatchObject({ attempt: 1 })
    await expect(loadSpatialImpl()).rejects.toMatchObject({ attempt: 2 })
    expect(__getSpatialLoadAttemptForTests()).toBe(2)
  })

  it('onSpatialLoadError supports multiple listeners and unsubscribe', async () => {
    setPuppeteerUserAgent()
    const first = vi.fn()
    const second = vi.fn()
    const unsubscribeFirst = onSpatialLoadError(first)
    onSpatialLoadError(second)
    __setSpatialImplLoaderForTests(() =>
      Promise.reject(new Error('chunk failed')),
    )

    await expect(loadSpatialImpl()).rejects.toBeInstanceOf(WebSpatialBootError)

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(first.mock.calls[0][0]).toBeInstanceOf(WebSpatialBootError)

    unsubscribeFirst()
    await expect(loadSpatialImpl()).rejects.toBeInstanceOf(WebSpatialBootError)

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(2)
  })

  it('useSpatialReady returns false and does not subscribe in plain web', () => {
    const { result } = renderHook(() => useSpatialReady())

    expect(result.current).toBe(false)
    expect(__getSpatialReadySubscriberCountForTests()).toBe(0)
  })

  it('useSpatialReady decides the runtime class once per component instance', () => {
    const { result, rerender } = renderHook(() => useSpatialReady())

    expect(result.current).toBe(false)
    expect(__getSpatialReadySubscriberCountForTests()).toBe(0)

    setPuppeteerUserAgent()
    rerender()

    expect(result.current).toBe(false)
    expect(__getSpatialReadySubscriberCountForTests()).toBe(0)
  })

  it('useSpatialReady subscribes in WebSpatial runtimes and reflects readiness flips', async () => {
    setPuppeteerUserAgent()
    __setSpatialImplLoaderForTests(() => Promise.resolve(spatialImpl))

    const { result } = renderHook(() => useSpatialReady())

    expect(result.current).toBe(false)
    expect(__getSpatialReadySubscriberCountForTests()).toBe(1)

    await act(async () => {
      await loadSpatialImpl()
    })

    expect(result.current).toBe(true)
  })
})
