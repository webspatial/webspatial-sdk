// Direct unit coverage for the SOLE `onSpatialContentReady` firing path.
//
// Product-confirmed semantics: the callback fires ONLY when a real WebSpatial
// spatial content host exists — modeled here by a truthy `spatializedElement`,
// a connected portal `dom`, and a connected `hostElement`. Any missing piece
// (the plain-web / pre-boot case) MUST NOT fire.

import React, { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, renderHook } from '@testing-library/react'
import type { SpatializedElement } from '@webspatial/core-sdk'
import { useSpatialContentReady } from './useSpatialContentReady'
import type { PortalInstanceObject } from '../context/PortalInstanceContext'

function connectedDiv(): HTMLDivElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

const fakeSpatialElement = {} as SpatializedElement

function readyParams(host: HTMLElement, portalDom: HTMLElement) {
  return {
    spatializedElement: fakeSpatialElement,
    portalInstanceObject: {
      dom: portalDom,
    } as unknown as PortalInstanceObject,
    hostElement: host,
  }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useSpatialContentReady — the only path that invokes onSpatialContentReady', () => {
  it('fires once with the connected host when a real spatial content host exists', () => {
    const host = connectedDiv()
    const portalDom = connectedDiv()
    const cb = vi.fn((ctx: { host: HTMLElement }) => {
      expect(ctx.host).toBe(host)
      expect(ctx.host.isConnected).toBe(true)
    })

    renderHook(() =>
      useSpatialContentReady({
        spatializedElement: fakeSpatialElement,
        portalInstanceObject: {
          dom: portalDom,
        } as unknown as PortalInstanceObject,
        hostElement: host,
        onSpatialContentReady: cb,
      }),
    )

    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does NOT fire when there is no spatial element (plain-web / pre-boot case)', () => {
    const host = connectedDiv()
    const cb = vi.fn()

    renderHook(() =>
      useSpatialContentReady({
        spatializedElement: undefined,
        portalInstanceObject: {
          dom: undefined,
        } as unknown as PortalInstanceObject,
        hostElement: host,
        onSpatialContentReady: cb,
      }),
    )

    expect(cb).not.toHaveBeenCalled()
  })

  it('does NOT fire when the host element is not connected', () => {
    const host = document.createElement('div') // not appended → not connected
    const portalDom = connectedDiv()
    const cb = vi.fn()

    renderHook(() =>
      useSpatialContentReady({
        spatializedElement: fakeSpatialElement,
        portalInstanceObject: {
          dom: portalDom,
        } as unknown as PortalInstanceObject,
        hostElement: host,
        onSpatialContentReady: cb,
      }),
    )

    expect(cb).not.toHaveBeenCalled()
  })

  it('does not re-fire on a stable re-render and runs cleanup on unmount', () => {
    const host = connectedDiv()
    const portalDom = connectedDiv()
    const cleanupFn = vi.fn()
    const cb = vi.fn(() => cleanupFn)

    const { rerender, unmount } = renderHook(
      (props: { cb: typeof cb }) =>
        useSpatialContentReady({
          spatializedElement: fakeSpatialElement,
          portalInstanceObject: {
            dom: portalDom,
          } as unknown as PortalInstanceObject,
          hostElement: host,
          onSpatialContentReady: props.cb,
        }),
      { initialProps: { cb } },
    )

    expect(cb).toHaveBeenCalledTimes(1)

    // Stable inputs (host/dom/element unchanged) ⇒ no re-emit.
    rerender({ cb })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cleanupFn).not.toHaveBeenCalled()

    unmount()
    expect(cleanupFn).toHaveBeenCalledTimes(1)
  })

  it('does NOT invoke onSpatialContentReady synchronously during render', () => {
    const host = connectedDiv()
    const portalDom = connectedDiv()
    const cb = vi.fn()

    function Probe() {
      useSpatialContentReady({
        ...readyParams(host, portalDom),
        onSpatialContentReady: cb,
      })
      expect(cb).not.toHaveBeenCalled()
      return null
    }

    render(<Probe />)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('invokes prior cleanup before the next rising edge after isReady falls', () => {
    const portalDom = connectedDiv()
    const host1 = connectedDiv()
    const cleanup = vi.fn()
    const cb = vi.fn(() => cleanup)
    const events: string[] = []
    cb.mockImplementation(() => {
      events.push('ready')
      return () => {
        cleanup()
        events.push('cleanup')
      }
    })

    const { rerender } = renderHook(
      ({ host }: { host: HTMLElement | null }) =>
        useSpatialContentReady({
          spatializedElement: host ? fakeSpatialElement : undefined,
          portalInstanceObject: {
            dom: portalDom,
          } as unknown as PortalInstanceObject,
          hostElement: host,
          onSpatialContentReady: cb,
        }),
      { initialProps: { host: null as HTMLElement | null } },
    )

    expect(cb).not.toHaveBeenCalled()

    rerender({ host: host1 })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(events).toEqual(['ready'])

    rerender({ host: null })
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(events).toEqual(['ready', 'cleanup'])

    const host2 = connectedDiv()
    rerender({ host: host2 })
    expect(cb).toHaveBeenCalledTimes(2)
    expect(events).toEqual(['ready', 'cleanup', 'ready'])
  })

  it('runs first cleanup before second ready under React StrictMode remount', () => {
    const host = connectedDiv()
    const portalDom = connectedDiv()
    const events: string[] = []
    let readyCount = 0
    const cb = vi.fn(() => {
      events.push(`ready${++readyCount}`)
      return () => {
        events.push(`cleanup${readyCount}`)
      }
    })

    renderHook(
      () =>
        useSpatialContentReady({
          ...readyParams(host, portalDom),
          onSpatialContentReady: cb,
        }),
      {
        wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
      },
    )

    expect(cb.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(events.indexOf('cleanup1')).toBeLessThan(events.indexOf('ready2'))
  })

  it('delivers parent and child ready independently when hosts connect in separate passes', () => {
    const parentCb = vi.fn()
    const childCb = vi.fn()

    function NestedPortalReadyTree() {
      const [childHost, setChildHost] = React.useState<HTMLElement | null>(null)
      const portalDom = React.useMemo(() => connectedDiv(), [])
      const parentHost = React.useMemo(() => connectedDiv(), [])

      React.useEffect(() => {
        setChildHost(connectedDiv())
      }, [])

      useSpatialContentReady({
        ...readyParams(parentHost, portalDom),
        onSpatialContentReady: parentCb,
      })

      useSpatialContentReady({
        spatializedElement: childHost ? fakeSpatialElement : undefined,
        portalInstanceObject: {
          dom: portalDom,
        } as unknown as PortalInstanceObject,
        hostElement: childHost,
        onSpatialContentReady: childCb,
      })

      return null
    }

    render(<NestedPortalReadyTree />)
    expect(parentCb).toHaveBeenCalledTimes(1)
    expect(childCb).toHaveBeenCalledTimes(1)
  })
})
