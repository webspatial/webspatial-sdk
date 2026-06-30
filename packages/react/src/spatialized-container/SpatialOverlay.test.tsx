import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SpatialOverlayRenderTargetContext } from './context/SpatialOverlayRenderTargetContext'
import { SpatialWindowContext } from './context/SpatialWindowContext'
import { SpatialOverlay, useSpatialOverlay } from './SpatialOverlay'

describe('SpatialOverlay', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders measurement content in the standard instance', () => {
    const onPortalTargetChange = vi.fn()

    const r = render(
      <SpatialOverlay
        measurementContent={<div data-testid="measurement">measure</div>}
        portalTargetName="overlay-target"
        onPortalTargetChange={onPortalTargetChange}
      >
        <div data-testid="visible">visible</div>
      </SpatialOverlay>,
    )

    expect(r.getByTestId('measurement').textContent).toBe('measure')
    expect(r.queryByTestId('visible')).toBeNull()
    expect(r.queryByTestId('overlay-target')).toBeNull()
    expect(onPortalTargetChange).not.toHaveBeenCalled()
  })

  it('uses children as measurement content by default in the standard instance', () => {
    const r = render(
      <SpatialOverlay portalTargetName="overlay-target">
        <div data-testid="default-measurement">default measure</div>
      </SpatialOverlay>,
    )

    expect(r.getByTestId('default-measurement').textContent).toBe(
      'default measure',
    )
    expect(r.container.querySelector('[data-name="overlay-target"]')).toBeNull()
  })

  it('renders a portal target and visible children in the portal instance', () => {
    const onPortalTargetChange = vi.fn()
    const win = { document: { body: document.body } } as WindowProxy

    const r = render(
      <SpatialWindowContext.Provider value={win}>
        <SpatialOverlay
          measurementContent={<div data-testid="measurement">measure</div>}
          portalTargetName="overlay-target"
          onPortalTargetChange={onPortalTargetChange}
        >
          <div data-testid="visible">visible</div>
        </SpatialOverlay>
      </SpatialWindowContext.Provider>,
    )

    const target = r.container.querySelector(
      '[data-name="overlay-target"]',
    ) as HTMLDivElement
    expect(target).not.toBeNull()
    expect(target.getAttribute('data-name')).toBe('overlay-target')
    expect(r.getByTestId('visible').textContent).toBe('visible')
    expect(r.queryByTestId('measurement')).toBeNull()
    expect(onPortalTargetChange).toHaveBeenCalledWith(target)
  })

  it('renders measurement content when an overlay placeholder is inside a parent portal window', () => {
    const win = { document: { body: document.body } } as WindowProxy

    const r = render(
      <SpatialWindowContext.Provider value={win}>
        <SpatialOverlayRenderTargetContext.Provider value="measurement">
          <SpatialOverlay portalTargetName="nested-overlay-target">
            <div data-testid="nested-measurement">nested measure</div>
          </SpatialOverlay>
        </SpatialOverlayRenderTargetContext.Provider>
      </SpatialWindowContext.Provider>,
    )

    expect(r.getByTestId('nested-measurement').textContent).toBe(
      'nested measure',
    )
    expect(
      r.container.querySelector('[data-name="nested-overlay-target"]'),
    ).toBeNull()
  })

  it('creates a portal option that automatically renders measurement and visible copies', async () => {
    const win = { document: { body: document.body } } as WindowProxy

    function Probe() {
      const { OverlayTarget, portalMenuOption } = useSpatialOverlay({
        portalTargetName: 'auto-overlay-target',
      })

      return (
        <>
          <SpatialOverlayRenderTargetContext.Provider value="measurement">
            <OverlayTarget />
          </SpatialOverlayRenderTargetContext.Provider>
          <SpatialWindowContext.Provider value={win}>
            <OverlayTarget />
          </SpatialWindowContext.Provider>
          {portalMenuOption(<div data-testid="auto-item">Auto item</div>)}
        </>
      )
    }

    const r = render(<Probe />)

    expect(
      r.container.querySelector('[data-name="auto-overlay-target"]'),
    ).not.toBeNull()
    expect(
      r.container.querySelector(
        '[data-name="auto-overlay-target-measurement"]',
      ),
    ).not.toBeNull()
    expect(r.getAllByTestId('auto-item')).toHaveLength(2)
  })

  it('renders portal option content when targets mount after the plugin first renders', async () => {
    // Simulates a separate plugin root that only received `portalMenuOption`
    // and rendered before the overlay targets existed. The returned node must
    // subscribe and re-render once the measurement/portal targets mount.
    const win = { document: { body: document.body } } as WindowProxy
    let showTargets: (value: boolean) => void = () => {}

    function Host() {
      const { OverlayTarget, portalMenuOption } = useSpatialOverlay({
        portalTargetName: 'late-overlay-target',
      })
      const [visible, setVisible] = React.useState(false)
      showTargets = setVisible

      return (
        <>
          {portalMenuOption(<div data-testid="late-item">Late item</div>)}
          {visible ? (
            <>
              <SpatialOverlayRenderTargetContext.Provider value="measurement">
                <OverlayTarget />
              </SpatialOverlayRenderTargetContext.Provider>
              <SpatialWindowContext.Provider value={win}>
                <OverlayTarget />
              </SpatialWindowContext.Provider>
            </>
          ) : null}
        </>
      )
    }

    const r = render(<Host />)

    // Targets not mounted yet: nothing is portaled.
    expect(r.queryAllByTestId('late-item')).toHaveLength(0)

    await act(async () => {
      showTargets(true)
    })

    // Targets mounted later: the subscription re-renders the option.
    expect(r.getAllByTestId('late-item')).toHaveLength(2)
  })
})
