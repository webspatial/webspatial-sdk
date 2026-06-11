import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SpatialOverlay } from './SpatialOverlay'
import { OverlayRenderModeContext } from './context/OverlayRenderModeContext'
import {
  SpatialWindowContext,
  useSpatialPortalContainer,
} from './context/SpatialWindowContext'

function PortalProbe() {
  const container = useSpatialPortalContainer()
  return <span data-testid="portal-probe">{String(container != null)}</span>
}

describe('SpatialOverlay', () => {
  it('renders measureChildren in measure mode without inheriting SpatialWindowContext', () => {
    const ref = React.createRef<HTMLDivElement>()
    const win = { document: { body: document.body } } as WindowProxy

    const r = render(
      <SpatialWindowContext.Provider value={win}>
        <OverlayRenderModeContext.Provider value="measure">
          <SpatialOverlay
            ref={ref}
            data-testid="overlay-measure"
            measureChildren={<div data-testid="measure-child">measure</div>}
          >
            <div data-testid="visible-child">visible</div>
            <PortalProbe />
          </SpatialOverlay>
        </OverlayRenderModeContext.Provider>
      </SpatialWindowContext.Provider>,
    )

    expect(r.getByTestId('overlay-measure')).toBe(ref.current)
    expect(r.getByTestId('measure-child').textContent).toBe('measure')
    expect(r.queryByTestId('visible-child')).toBeNull()
    expect(r.queryByTestId('portal-probe')).toBeNull()
  })

  it('keeps nested SpatialOverlay in measure mode as measurement-only DOM', () => {
    const r = render(
      <OverlayRenderModeContext.Provider value="measure">
        <SpatialOverlay data-testid="outer-overlay">
          <SpatialOverlay
            data-testid="inner-overlay"
            measureChildren={<div data-testid="inner-measure">measure</div>}
          >
            <div data-testid="inner-visible">visible</div>
          </SpatialOverlay>
        </SpatialOverlay>
      </OverlayRenderModeContext.Provider>,
    )

    expect(r.getByTestId('outer-overlay')).toBeInstanceOf(HTMLDivElement)
    expect(r.getByTestId('inner-overlay')).toBeInstanceOf(HTMLDivElement)
    expect(r.getByTestId('inner-measure').textContent).toBe('measure')
    expect(r.queryByTestId('inner-visible')).toBeNull()
  })
})
