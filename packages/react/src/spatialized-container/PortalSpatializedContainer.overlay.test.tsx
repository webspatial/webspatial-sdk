import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PortalSpatializedContainer } from './PortalSpatializedContainer'
import {
  SpatializedContainerContext,
  SpatializedContainerObject,
} from './context/SpatializedContainerContext'
import {
  PortalInstanceContext,
  PortalInstanceObject,
} from './context/PortalInstanceContext'
import { SpatialID } from './SpatialID'

// getSession is only reached if an element is attached (it is not here, because
// createSpatializedElement resolves to null), but mock it to be safe.
vi.mock('../utils', () => ({ getSession: () => ({}) }))

function NullContent() {
  return null
}

/**
 * Scenario 3 make-or-break (structural half, jsdom): when a nested `enable-xr`
 * is detected as overlay, the placeholder host rendered in the parent spatial
 * window must receive the floating library's `asChild` ref + props, render the
 * menu `children` (hidden, for measurement), and be registered so
 * `notify2DFrameChange` can find it. The real non-zero layout / native hit-test
 * half is AVP-only (task 5.9).
 */
describe('PortalSpatializedContainer — Scenario 3 overlay placeholder', () => {
  it('lands asChild ref/props/children on the hidden host and registers it', () => {
    const containerObject = new SpatializedContainerObject()
    const registerSpy = vi.spyOn(containerObject, 'registerSpatialDom')
    const parentPortal = new PortalInstanceObject(
      'parent',
      containerObject,
      null,
    )

    const hostRef = React.createRef<HTMLElement>()

    // The developer declares the floating surface via `data-xr-overlay`; Radix
    // still injects `asChild` positioning props/ref that must land on the host.
    const radixLike = {
      'data-xr-overlay': true,
      role: 'menu',
      'data-side': 'bottom',
      'data-align': 'end',
      'data-testid': 'overlay-host',
      style: {
        ['--xr-back']: 12,
        animation: 'scaleIn 140ms ease-out',
        color: 'rgb(255, 0, 0)',
        transition: 'opacity 120ms ease-out',
      },
    }

    render(
      <SpatializedContainerContext.Provider value={containerObject}>
        <PortalInstanceContext.Provider value={parentPortal}>
          <PortalSpatializedContainer
            component="div"
            spatializedContent={NullContent}
            createSpatializedElement={() => Promise.resolve(null) as any}
            hostRef={hostRef}
            {...(radixLike as any)}
            {...{ [SpatialID]: 'overlay-sid' }}
          >
            <div data-testid="menu-item">Login / Register</div>
          </PortalSpatializedContainer>
        </PortalInstanceContext.Provider>
      </SpatializedContainerContext.Provider>,
    )

    const host = hostRef.current
    expect(host).toBeInstanceOf(HTMLElement)
    const el = host as HTMLElement

    // children rendered into the hidden host (dual-render for measurement)
    expect(el.querySelector('[data-testid="menu-item"]')?.textContent).toBe(
      'Login / Register',
    )

    // Radix props/data land on the placeholder host
    expect(el.getAttribute('role')).toBe('menu')
    expect(el.getAttribute('data-side')).toBe('bottom')
    expect(el.getAttribute('data-align')).toBe('end')
    expect(el.getAttribute(SpatialID)).toBe('overlay-sid')

    // host is hidden in the parent window (the visible copy is the child webview)
    expect(el.style.visibility).toBe('hidden')
    expect(el.style.pointerEvents).toBe('none')

    // Radix/user inline style (incl. the spatial var) is preserved for measurement
    expect(el.style.getPropertyValue('--xr-back')).toBe('12')
    expect(el.style.color).toBe('rgb(255, 0, 0)')

    // Measurement must not sample transient animation/transition frames.
    // The visible portal copy can animate; the hidden parent-window host only
    // exists to provide stable geometry/style inputs for native surface sync.
    expect(el.style.animation).toBe('none')
    expect(el.style.transition).toBe('none')

    // registered so notify2DFrameChange can locate + measure it
    expect(registerSpy).toHaveBeenCalledWith('overlay-sid', el)
  })
})
