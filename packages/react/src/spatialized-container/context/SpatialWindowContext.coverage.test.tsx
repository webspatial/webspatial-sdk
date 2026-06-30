import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  SpatialWindowContext,
  useSpatialPortalContainer,
} from './SpatialWindowContext'

function Probe() {
  const container = useSpatialPortalContainer()
  return (
    <div
      data-testid="probe"
      data-has-container={String(container != null)}
      data-is-body={String(container === document.body)}
    />
  )
}

describe('SpatialWindowContext', () => {
  afterEach(() => {
    cleanup()
  })

  it('returns undefined outside a spatial window provider', () => {
    const r = render(<Probe />)
    expect(r.getByTestId('probe').getAttribute('data-has-container')).toBe(
      'false',
    )
  })

  it('exposes the spatial window document body as a portal container', () => {
    const win = { document: { body: document.body } } as WindowProxy

    const r = render(
      <SpatialWindowContext.Provider value={win}>
        <Probe />
      </SpatialWindowContext.Provider>,
    )

    expect(r.getByTestId('probe').getAttribute('data-is-body')).toBe('true')
  })
})
