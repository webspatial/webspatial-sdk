import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  __resetSpatialRouteCleanupForTests,
  prepareSpatialRouteLifetime,
  trackSpatialRouteObject,
  trackSpatialRouteWindowProxy,
  untrackSpatialRouteObject,
  untrackSpatialRouteWindowProxy,
} from './spatial-route-cleanup'

function makeSpatialObject(id: string) {
  return {
    id,
    isDestroyed: false,
    destroy: vi.fn(async function (this: { isDestroyed: boolean }) {
      this.isDestroyed = true
    }),
  }
}

function makeWindowProxy() {
  return {
    close: vi.fn(),
  } as unknown as WindowProxy & { close: ReturnType<typeof vi.fn> }
}

describe('spatial route cleanup', () => {
  afterEach(() => {
    __resetSpatialRouteCleanupForTests()
    delete window.__webspatialsdk__
  })

  it('destroys tracked spatial objects in reverse order on hash route change', async () => {
    prepareSpatialRouteLifetime()
    const first = makeSpatialObject('first')
    const second = makeSpatialObject('second')
    const order: string[] = []
    first.destroy.mockImplementation(async () => {
      order.push('first')
      first.isDestroyed = true
    })
    second.destroy.mockImplementation(async () => {
      order.push('second')
      second.isDestroyed = true
    })

    trackSpatialRouteObject(first as any)
    trackSpatialRouteObject(second as any)

    window.history.pushState(null, '', '#/cleanup-target')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await Promise.resolve()

    expect(order).toEqual(['second', 'first'])
    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect(second.destroy).toHaveBeenCalledTimes(1)
  })

  it('closes tracked window proxies on hash route change', async () => {
    prepareSpatialRouteLifetime()
    const first = makeWindowProxy()
    const second = makeWindowProxy()

    trackSpatialRouteWindowProxy(first)
    trackSpatialRouteWindowProxy(second)

    window.history.pushState(null, '', '#/window-cleanup-target')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await Promise.resolve()

    expect(first.close).toHaveBeenCalledTimes(1)
    expect(second.close).toHaveBeenCalledTimes(1)
  })

  it('keeps current-route window proxies when a delayed hashchange event arrives', async () => {
    window.history.replaceState(null, '', '#/previous')
    prepareSpatialRouteLifetime()
    const currentWindowProxy = makeWindowProxy()

    window.history.pushState(null, '', '#/current')
    trackSpatialRouteWindowProxy(currentWindowProxy, window.location.href)

    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await Promise.resolve()

    expect(currentWindowProxy.close).not.toHaveBeenCalled()
  })

  it('does not destroy untracked objects on route change', async () => {
    prepareSpatialRouteLifetime()
    const object = makeSpatialObject('removed')
    trackSpatialRouteObject(object as any)
    untrackSpatialRouteObject(object as any)

    window.dispatchEvent(new PopStateEvent('popstate'))
    await Promise.resolve()

    expect(object.destroy).not.toHaveBeenCalled()
  })

  it('does not close untracked window proxies on route change', async () => {
    prepareSpatialRouteLifetime()
    const windowProxy = makeWindowProxy()
    trackSpatialRouteWindowProxy(windowProxy)
    untrackSpatialRouteWindowProxy(windowProxy)

    window.dispatchEvent(new PopStateEvent('popstate'))
    await Promise.resolve()

    expect(windowProxy.close).not.toHaveBeenCalled()
  })

  it('closes all tracked window proxies when the page context is hidden', async () => {
    prepareSpatialRouteLifetime()
    const currentWindowProxy = makeWindowProxy()

    trackSpatialRouteWindowProxy(currentWindowProxy)

    window.dispatchEvent(new PageTransitionEvent('pagehide'))
    await Promise.resolve()

    expect(currentWindowProxy.close).toHaveBeenCalledTimes(1)
  })

  it('destroys all tracked spatial objects before the page context unloads', async () => {
    prepareSpatialRouteLifetime()
    const object = makeSpatialObject('beforeunload')

    trackSpatialRouteObject(object as any)

    window.dispatchEvent(new Event('beforeunload'))
    await Promise.resolve()

    expect(object.destroy).toHaveBeenCalledTimes(1)
  })

  it('does not mutate native-owned pageEpoch', async () => {
    window.__webspatialsdk__ = { pageEpoch: 42 }
    prepareSpatialRouteLifetime()

    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await Promise.resolve()

    expect(window.__webspatialsdk__?.pageEpoch).toBe(42)
  })

  it('destroys immediately when creation resolves after the route has changed', async () => {
    const ownerHref = prepareSpatialRouteLifetime()
    const object = makeSpatialObject('stale')
    window.history.pushState(null, '', '#/other-route')

    trackSpatialRouteObject(object as any, ownerHref)
    await Promise.resolve()

    expect(object.destroy).toHaveBeenCalledTimes(1)
  })

  it('closes immediately when window proxy creation resolves after route change', async () => {
    window.history.replaceState(null, '', '#/window-owner')
    const ownerHref = prepareSpatialRouteLifetime()
    const windowProxy = makeWindowProxy()
    window.history.pushState(null, '', '#/other-window-route')

    trackSpatialRouteWindowProxy(windowProxy, ownerHref)
    await Promise.resolve()

    expect(windowProxy.close).toHaveBeenCalledTimes(1)
  })

  it('polls href changes when hashchange/popstate is not emitted', async () => {
    vi.useFakeTimers()
    const object = makeSpatialObject('poll')
    prepareSpatialRouteLifetime()
    trackSpatialRouteObject(object as any)

    window.history.pushState(null, '', '#/polled-route')
    vi.advanceTimersByTime(250)
    await Promise.resolve()

    expect(object.destroy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
