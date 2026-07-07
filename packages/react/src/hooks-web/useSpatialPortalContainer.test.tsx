import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useSpatialPortalContainer } from './useSpatialPortalContainer'

function PortalContainerProbe() {
  const container = useSpatialPortalContainer()
  return (
    <div
      data-testid="probe"
      data-is-body={String(container === document.body)}
    />
  )
}

describe('useSpatialPortalContainer default entry', () => {
  afterEach(() => {
    cleanup()
  })

  it('returns document.body in plain web without an extra provider', () => {
    const view = render(<PortalContainerProbe />)

    expect(view.getByTestId('probe').getAttribute('data-is-body')).toBe('true')
  })
})
