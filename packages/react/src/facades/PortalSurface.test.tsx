import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PortalSurface } from './PortalSurface'
import { useSpatialPortalContainer } from '../hooks-web/useSpatialPortalContainer'

// @ts-expect-error PortalSurface intentionally has no visibility prop; callers should mount/unmount it.
;<PortalSurface visible={false} />
// @ts-expect-error PortalSurface starts with a minimal API: children, zOffset, and backgroundMaterial only.
;<PortalSurface className="unsupported" />

function PortalProbe() {
  const container = useSpatialPortalContainer()
  return (
    <div
      data-testid="probe"
      data-has-container={String(container != null)}
      data-is-body={String(container === document.body)}
    />
  )
}

describe('PortalSurface default-entry facade', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders plain-web fallback children and provides document.body as portal container', () => {
    const view = render(
      <PortalSurface zOffset={100}>
        <PortalProbe />
      </PortalSurface>,
    )

    expect(
      view.container.querySelector('[data-webspatial-portal-surface-fallback]'),
    ).toBeTruthy()
    expect(view.getByTestId('probe').getAttribute('data-is-body')).toBe('true')
  })

  it('does not leak spatial-only zOffset as a DOM attribute in plain-web fallback', () => {
    const view = render(<PortalSurface zOffset={100}>content</PortalSurface>)

    expect(
      view.container
        .querySelector('[data-webspatial-portal-surface-fallback]')
        ?.getAttribute('zOffset'),
    ).toBeNull()
  })
})
