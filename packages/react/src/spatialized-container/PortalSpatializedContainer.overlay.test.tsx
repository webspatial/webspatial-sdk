import React from 'react'
import { render, waitFor } from '@testing-library/react'
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

class TestDOMMatrix {}

if (!('DOMMatrix' in globalThis)) {
  ;(globalThis as any).DOMMatrix = TestDOMMatrix
}

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

    // Props a floating library (Radix) injects onto the asChild content node.
    const radixLike = {
      role: 'menu',
      'data-side': 'bottom',
      'data-align': 'end',
      'data-testid': 'overlay-host',
      style: { ['--xr-back']: 12, color: 'rgb(255, 0, 0)' },
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

    // registered so notify2DFrameChange can locate + measure it
    expect(registerSpy).toHaveBeenCalledWith('overlay-sid', el)
  })

  it('uses explicit overlayPortalMode and splits positioning style away from visible content', async () => {
    const containerObject = new SpatializedContainerObject()
    const parentPortal = new PortalInstanceObject(
      'parent',
      containerObject,
      null,
    )
    const hostRef = React.createRef<HTMLElement>()

    const Content = vi.fn((props: any) => (
      <div
        data-testid="visible-root"
        data-style-transform={props.style?.transform ?? ''}
        data-style-position={props.style?.position ?? ''}
        data-xr-back={props.style?.['--xr-back'] ?? ''}
        data-background={props.style?.background ?? ''}
      >
        {props.children}
      </div>
    ))

    render(
      <SpatializedContainerContext.Provider value={containerObject}>
        <PortalInstanceContext.Provider value={parentPortal}>
          <PortalSpatializedContainer
            component="div"
            spatializedContent={Content as any}
            createSpatializedElement={() =>
              Promise.resolve({
                updateProperties: vi.fn(),
                updateTransform: vi.fn(),
                destroy: vi.fn(),
              }) as any
            }
            hostRef={hostRef}
            overlayPortalMode
            data-testid="overlay-host"
            style={{
              position: 'fixed',
              transform: 'translate(10px, 20px)',
              left: 10,
              top: 20,
              width: 160,
              background: 'rgb(0, 128, 255)',
              ['--xr-back' as any]: 80,
            }}
            {...{ [SpatialID]: 'explicit-overlay-sid' }}
          >
            <div data-testid="menu-item">Visible item</div>
          </PortalSpatializedContainer>
        </PortalInstanceContext.Provider>
      </SpatializedContainerContext.Provider>,
    )

    const host = hostRef.current as HTMLElement
    expect(host).toBeInstanceOf(HTMLElement)
    expect(host.style.position).toBe('fixed')
    expect(host.style.transform).toContain('translate')
    expect(host.style.getPropertyValue('--xr-back')).toBe('80')

    await waitFor(() => expect(Content).toHaveBeenCalled())
    const visibleProps = Content.mock.calls.at(-1)?.[0]
    expect(visibleProps.style.transform).toBeUndefined()
    expect(visibleProps.style.position).toBeUndefined()
    expect(visibleProps.style.left).toBeUndefined()
    expect(visibleProps.style.top).toBeUndefined()
    expect(visibleProps.style['--xr-back']).toBe(80)
    expect(visibleProps.style.background).toBe('rgb(0, 128, 255)')
  })

  it('uses measureChildren only for the hidden overlay placeholder', async () => {
    const containerObject = new SpatializedContainerObject()
    const parentPortal = new PortalInstanceObject(
      'parent',
      containerObject,
      null,
    )
    const hostRef = React.createRef<HTMLElement>()

    const Content = vi.fn((props: any) => (
      <div data-testid="visible-root">{props.children}</div>
    ))

    render(
      <SpatializedContainerContext.Provider value={containerObject}>
        <PortalInstanceContext.Provider value={parentPortal}>
          <PortalSpatializedContainer
            component="div"
            spatializedContent={Content as any}
            createSpatializedElement={() =>
              Promise.resolve({
                updateProperties: vi.fn(),
                updateTransform: vi.fn(),
                destroy: vi.fn(),
              }) as any
            }
            hostRef={hostRef}
            overlayPortalMode
            measureChildren={
              <div data-testid="measure-child">measure only</div>
            }
            {...{ [SpatialID]: 'explicit-overlay-measure-sid' }}
          >
            <div data-testid="visible-child">visible only</div>
          </PortalSpatializedContainer>
        </PortalInstanceContext.Provider>
      </SpatializedContainerContext.Provider>,
    )

    const host = hostRef.current as HTMLElement
    expect(host.querySelector('[data-testid="measure-child"]')).not.toBeNull()
    expect(host.querySelector('[data-testid="visible-child"]')).toBeNull()

    await waitFor(() => expect(Content).toHaveBeenCalled())
    const visibleProps = Content.mock.calls.at(-1)?.[0]
    expect(visibleProps.children.props['data-testid']).toBe('visible-child')
  })
})
