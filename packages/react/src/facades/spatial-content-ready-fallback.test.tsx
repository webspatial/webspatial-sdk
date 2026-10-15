// onSpatialContentReady on the DEFAULT (lazy) entry's plain-web fallback path.
//
// Product-confirmed semantics: `onSpatialContentReady` fires ONLY when a real
// WebSpatial spatial content host exists (the portal path in
// `useSpatialContentReady`). Any plain-web / pre-boot degraded render MUST NOT
// invoke it — but MUST still strip it from the DOM attribute space and keep
// forwarding the spatial ref.
//
// This exercises the real consumer path:
//   `<div enable-xr onSpatialContentReady={cb} />`
//     → SDK JSX runtime (`replaceToSpatialPrimitiveType`)
//     → `withSpatialized2DElementContainer('div')` facade
//     → (useSpatialReady() === false) plain-web fallback
//
// Per spec `spatialdiv-content-host-lifecycle`:
//   - "Degraded container keeps DOM attribute namespace clean"
//   - "Non-WebSpatial fallback does NOT invoke ready"

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { cleanup, render } from '@testing-library/react'
import { jsx } from '../jsx/jsx-shared'
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

beforeEach(() => {
  vi.unstubAllGlobals()
  __resetSpatialBridgeForTests()
  __resetBootStateForTests()
  __resetBootForgottenWarningForTests()
  __resetWithSpatialized2DElementContainerCacheForTests()
  setPlainWebUserAgent()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  __resetSpatialBridgeForTests()
  __resetBootStateForTests()
  __resetBootForgottenWarningForTests()
  __resetWithSpatialized2DElementContainerCacheForTests()
})

describe('default-entry SpatialDiv plain-web fallback: onSpatialContentReady is NOT invoked', () => {
  it('does NOT invoke onSpatialContentReady on the plain-web fallback host', () => {
    const cb = vi.fn()
    renderSpatialDiv({ onSpatialContentReady: cb, 'data-testid': 'host' })
    expect(cb).not.toHaveBeenCalled()
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

  it('still forwards the spatial ref to the connected plain host', () => {
    const ref = createRef<HTMLElement>()
    const { getByTestId } = renderSpatialDiv({
      ref,
      onSpatialContentReady: () => {},
      'data-testid': 'host',
    })

    expect(ref.current).not.toBeNull()
    expect(ref.current).toBe(getByTestId('host'))
    expect(ref.current?.isConnected).toBe(true)
  })

  it('does not invoke on re-render or unmount either', () => {
    const cb = vi.fn()
    const { rerender, unmount } = render(
      jsx(
        'div',
        { 'enable-xr': true, onSpatialContentReady: cb, id: 'x' },
        undefined,
      ) as any,
    )
    rerender(
      jsx(
        'div',
        { 'enable-xr': true, onSpatialContentReady: cb, id: 'x' },
        undefined,
      ) as any,
    )
    unmount()
    expect(cb).not.toHaveBeenCalled()
  })

  it('renders the plain element cleanly when no callback is provided', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { getByTestId } = renderSpatialDiv({ 'data-testid': 'host' })
    expect(getByTestId('host').tagName).toBe('DIV')
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
