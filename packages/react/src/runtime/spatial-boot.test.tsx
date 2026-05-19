import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetSpatialBridgeForTests,
  __setSpatialImplLoaderForTests,
  type SpatialImplementation,
} from './bridge'
import {
  __resetBootStateForTests,
  hasBootSpatialBeenCalled,
} from './boot'
import { SpatialBoot } from './SpatialBoot'
import { WebSpatialBootError } from './errors'
import { useBootSpatial } from './useBootSpatial'

const spatialImpl = {} as SpatialImplementation

function setPlainWebUserAgent(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36',
    configurable: true,
  })
}

function setPuppeteerUserAgent(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36',
  })
}

describe('useBootSpatial / SpatialBoot', () => {
  beforeEach(() => {
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
    setPlainWebUserAgent()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    __resetSpatialBridgeForTests()
    __resetBootStateForTests()
  })

  it('auto-boot resolves to ready on plain web', async () => {
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)

    const { result } = renderHook(() => useBootSpatial())

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.status).toBe('ready')
    expect(result.current.error).toBeNull()
    expect(loader).not.toHaveBeenCalled()
  })

  it('calls onReady after successful boot in WebSpatial runtime', async () => {
    setPuppeteerUserAgent()
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)
    const onReady = vi.fn()

    renderHook(() => useBootSpatial({ onReady }))

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(onReady).toHaveBeenCalledTimes(1)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('sets failed status and invokes onError for WebSpatialBootError', async () => {
    setPuppeteerUserAgent()
    const cause = new Error('chunk failed')
    __setSpatialImplLoaderForTests(() => Promise.reject(cause))
    const onError = vi.fn()

    const { result } = renderHook(() => useBootSpatial({ onError }))

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBeInstanceOf(WebSpatialBootError)
    expect(onError).toHaveBeenCalledWith(result.current.error)
  })

  it('SpatialBoot without gate renders children immediately', () => {
    render(
      <SpatialBoot>
        <span data-testid="child">child</span>
      </SpatialBoot>,
    )

    expect(screen.getByTestId('child')).toBeTruthy()
  })

  it('SpatialBoot with gate hides children until boot completes', async () => {
    setPuppeteerUserAgent()
    let resolveLoad!: (impl: SpatialImplementation) => void
    __setSpatialImplLoaderForTests(
      () =>
        new Promise<SpatialImplementation>(resolve => {
          resolveLoad = resolve
        }),
    )

    const view = render(
      <SpatialBoot gate fallback={<span data-testid="loading">loading</span>}>
        <span data-testid="child-gated">child</span>
      </SpatialBoot>,
    )

    const scoped = within(view.container)
    expect(scoped.getByTestId('loading')).toBeTruthy()
    expect(scoped.queryByTestId('child-gated')).toBeNull()

    await act(async () => {
      resolveLoad(spatialImpl)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(scoped.getByTestId('child-gated')).toBeTruthy()
    expect(scoped.queryByTestId('loading')).toBeNull()
  })

  it('SpatialBoot with gate mounts children after boot failure', async () => {
    setPuppeteerUserAgent()
    __setSpatialImplLoaderForTests(() => Promise.reject(new Error('fail')))

    const view = render(
      <SpatialBoot gate fallback={<span data-testid="loading-fail">loading</span>}>
        <span data-testid="child-fail">child</span>
      </SpatialBoot>,
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(within(view.container).getByTestId('child-fail')).toBeTruthy()
  })

  it('warns in dev when fallback is passed without gate', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <SpatialBoot fallback={<span>ignored</span>}>
        <span>child</span>
      </SpatialBoot>,
    )

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('unless `gate` is true'),
    )
  })

  it('manual boot() re-invokes bootSpatial', async () => {
    setPuppeteerUserAgent()
    const loader = vi.fn(() => Promise.resolve(spatialImpl))
    __setSpatialImplLoaderForTests(loader)

    const { result } = renderHook(() => useBootSpatial({ auto: false }))

    expect(result.current.status).toBe('idle')

    await act(async () => {
      await result.current.boot()
    })

    expect(result.current.status).toBe('ready')
    expect(loader).toHaveBeenCalledTimes(1)
    expect(hasBootSpatialBeenCalled()).toBe(true)
  })
})
