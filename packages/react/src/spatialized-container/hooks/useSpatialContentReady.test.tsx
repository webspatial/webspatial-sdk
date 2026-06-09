// Direct unit coverage for the SOLE `onSpatialContentReady` firing path.
//
// Product-confirmed semantics: the callback fires ONLY when a real WebSpatial
// spatial content host exists — modeled here by a truthy `spatializedElement`,
// a connected portal `dom`, and a connected `hostElement`. Any missing piece
// (the plain-web / pre-boot case) MUST NOT fire.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { SpatializedElement } from '@webspatial/core-sdk'
import { useSpatialContentReady } from './useSpatialContentReady'
import type { PortalInstanceObject } from '../context/PortalInstanceContext'

function connectedDiv(): HTMLDivElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

const fakeSpatialElement = {} as SpatializedElement

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
})
