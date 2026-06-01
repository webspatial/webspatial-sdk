// onSpatialContentReady on the DEFAULT (lazy) entry's plain-web fallback path.
//
// These tests exercise the real consumer path that the prior coverage missed:
//   `<div enable-xr onSpatialContentReady={cb} />`
//     → SDK JSX runtime (`replaceToSpatialPrimitiveType`)
//     → `withSpatialized2DElementContainer('div')` facade
//     → (useSpatialReady() === false) plain-web fallback host
//
// Per spec `spatialdiv-content-host-lifecycle` "Non-WebSpatial fallback must
// keep API usable without leaking DOM attributes" + the acceptance test matrix.

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'
import { createRef } from 'react'
import { cleanup, render } from '@testing-library/react'
import { jsx } from '../jsx/jsx-shared'
import type { SpatialContentReadyContext } from '../spatialized-container/types'
import { __resetSpatialBridgeForTests } from '../runtime/bridge'
import { __resetBootStateForTests } from '../runtime/boot'
import { __resetBootForgottenWarningForTests } from './shared/warnBootForgotten'
import { __resetWithSpatialized2DElementContainerCacheForTests } from './withSpatialized2DElementContainer'

function setPlainWebUserAgent(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36',
    configurable: true,
  })
}

// Render the element exactly as the SDK JSX transform would emit it for
// `<div enable-xr {...props} />` — through the SDK JSX runtime.
function renderSpatialDiv(props: Record<string, unknown>) {
  return render(jsx('div', { 'enable-xr': true, ...props }, undefined) as any)
}

let warnSpy: MockInstance
let errorSpy: MockInstance

beforeEach(() => {
  vi.unstubAllGlobals()
  __resetSpatialBridgeForTests()
  __resetBootStateForTests()
  __resetBootForgottenWarningForTests()
  __resetWithSpatialized2DElementContainerCacheForTests()
  setPlainWebUserAgent()
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  warnSpy.mockRestore()
  errorSpy.mockRestore()
  vi.unstubAllGlobals()
  __resetSpatialBridgeForTests()
  __resetBootStateForTests()
  __resetBootForgottenWarningForTests()
  __resetWithSpatialized2DElementContainerCacheForTests()
})

describe('default-entry SpatialDiv fallback: onSpatialContentReady (spec acceptance matrix)', () => {
  it('invokes onSpatialContentReady once with a CONNECTED fallback host (layout-effect timing)', () => {
    const calls: SpatialContentReadyContext[] = []
    let connectedAtCall = false
    const cb = vi.fn((ctx: SpatialContentReadyContext) => {
      calls.push(ctx)
      connectedAtCall = ctx.host.isConnected
    })

    const { getByTestId } = renderSpatialDiv({
      onSpatialContentReady: cb,
      'data-testid': 'host',
    })

    expect(cb).toHaveBeenCalledTimes(1)
    // Connected at invocation time ⇒ ran after commit (not during render).
    expect(connectedAtCall).toBe(true)
    expect(calls[0].host).toBe(getByTestId('host'))
    expect(calls[0].host.tagName).toBe('DIV')
  })

  it('does NOT leak onSpatialContentReady as a DOM attribute', () => {
    const { getByTestId } = renderSpatialDiv({
      onSpatialContentReady: () => {},
      'data-testid': 'host',
    })

    const host = getByTestId('host')
    expect(host.getAttribute('onSpatialContentReady')).toBeNull()
    expect(host.getAttribute('onspatialcontentready')).toBeNull()
    expect(host.hasAttribute('enable-xr')).toBe(false)
  })

  it('does NOT re-invoke when re-rendering with a stable host (even with a new callback identity)', () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()

    const { rerender } = render(
      jsx(
        'div',
        { 'enable-xr': true, onSpatialContentReady: cb1, id: 'x' },
        undefined,
      ) as any,
    )
    expect(cb1).toHaveBeenCalledTimes(1)

    rerender(
      jsx(
        'div',
        { 'enable-xr': true, onSpatialContentReady: cb2, id: 'x' },
        undefined,
      ) as any,
    )

    // Stable ready ⇒ no re-emit; the new callback identity is NOT invoked.
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(0)
  })

  it('runs the returned cleanup on unmount (falling edge)', () => {
    const cleanupFn = vi.fn()
    const cb = vi.fn(() => cleanupFn)

    const { unmount } = renderSpatialDiv({ onSpatialContentReady: cb })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cleanupFn).toHaveBeenCalledTimes(0)

    unmount()
    expect(cleanupFn).toHaveBeenCalledTimes(1)
  })

  it('remount releases external resources: first cleanup runs before the second ready', () => {
    // Faithful to the matrix "StrictMode-style remount" item: a remount (here
    // forced deterministically via a changed key) MUST run the first ready's
    // cleanup before the second ready fires.
    const order: string[] = []
    const cb = vi.fn(() => {
      order.push('ready')
      return () => {
        order.push('cleanup')
      }
    })

    const elementWithKey = (k: string) =>
      jsx('div', { 'enable-xr': true, onSpatialContentReady: cb }, k) as any

    const { rerender } = render(elementWithKey('a'))
    expect(order).toEqual(['ready'])

    // New key at the same position ⇒ React unmounts 'a' then mounts 'b'.
    rerender(elementWithKey('b'))

    expect(order).toEqual(['ready', 'cleanup', 'ready'])
  })

  it('forwards the spatial ref to the connected host (non-null when ready fires)', () => {
    const ref = createRef<HTMLElement>()
    let hostAtReady: HTMLElement | null = null
    const cb = vi.fn((ctx: SpatialContentReadyContext) => {
      hostAtReady = ctx.host
    })

    renderSpatialDiv({
      ref,
      onSpatialContentReady: cb,
      'data-testid': 'host',
    })

    expect(ref.current).not.toBeNull()
    expect(ref.current).toBe(hostAtReady)
    expect(ref.current?.isConnected).toBe(true)
  })

  it('deduplicates the callback ref: invoked once with the node, once with null on unmount', () => {
    const refCalls: Array<HTMLElement | null> = []
    const refCb = (node: HTMLElement | null) => {
      refCalls.push(node)
    }

    const { unmount } = renderSpatialDiv({ ref: refCb })
    expect(refCalls.filter(Boolean)).toHaveLength(1)

    unmount()
    expect(refCalls[refCalls.length - 1]).toBeNull()
    // No spurious duplicate dispatches for the same effective value.
    expect(refCalls).toHaveLength(2)
  })

  it('does not invoke the callback when none is provided (no throw, clean DOM)', () => {
    const { getByTestId } = renderSpatialDiv({ 'data-testid': 'host' })
    expect(getByTestId('host').tagName).toBe('DIV')
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
