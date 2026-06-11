import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SpatializedContainer } from './SpatializedContainer'
import { OverlayRenderModeContext } from './context/OverlayRenderModeContext'
import {
  SpatialWindowContext,
  useSpatialPortalContainer,
} from './context/SpatialWindowContext'

vi.mock('../utils/getSession', () => ({
  getSession: () => ({ getSpatialScene: vi.fn() }),
}))

function NullContent() {
  return null
}

function PortalProbe() {
  const container = useSpatialPortalContainer()
  return <span data-testid="portal-probe">{String(container != null)}</span>
}

describe('MeasureModeContainer', () => {
  it('renders enable-xr content as plain DOM and blocks SpatialWindowContext inheritance', () => {
    const createSpatializedElement = vi.fn()
    const ref = React.createRef<HTMLDivElement>()
    const win = { document: { body: document.body } } as WindowProxy

    const r = render(
      <SpatialWindowContext.Provider value={win}>
        <OverlayRenderModeContext.Provider value="measure">
          <SpatializedContainer
            ref={ref}
            component="div"
            spatializedContent={NullContent}
            createSpatializedElement={createSpatializedElement}
            data-testid="measure-host"
            style={{ width: 120 }}
          >
            <PortalProbe />
          </SpatializedContainer>
        </OverlayRenderModeContext.Provider>
      </SpatialWindowContext.Provider>,
    )

    expect(r.getByTestId('measure-host')).toBe(ref.current)
    expect(r.getByTestId('measure-host').getAttribute('style')).toContain(
      'width: 120px',
    )
    expect(r.getByTestId('portal-probe').textContent).toBe('false')
    expect(createSpatializedElement).not.toHaveBeenCalled()
  })
})
