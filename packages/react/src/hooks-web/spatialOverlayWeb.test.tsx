import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useSpatialOverlayWeb } from './spatialOverlayWeb'

describe('useSpatialOverlayWeb', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a single visible overlay target with children', () => {
    function Host() {
      const { OverlayTarget } = useSpatialOverlayWeb({
        portalTargetName: 'plain-web-overlay-target',
      })

      return (
        <OverlayTarget>
          <div data-testid="shell-child">shell</div>
        </OverlayTarget>
      )
    }

    const r = render(<Host />)

    expect(
      r.container.querySelector('[data-name="plain-web-overlay-target"]'),
    ).not.toBeNull()
    expect(r.getByTestId('shell-child').textContent).toBe('shell')
  })

  it('portals plugin items into the overlay target', async () => {
    function Host() {
      const { OverlayTarget, portalMenuOption } = useSpatialOverlayWeb({
        portalTargetName: 'plain-web-overlay-target',
      })

      return (
        <>
          <OverlayTarget />
          {portalMenuOption(<div data-testid="plain-item">Plain item</div>)}
        </>
      )
    }

    const r = render(<Host />)

    expect(r.getAllByTestId('plain-item')).toHaveLength(1)
  })

  it('renders portaled items after the overlay target mounts later', async () => {
    let showTarget: (value: boolean) => void = () => {}

    function Host() {
      const { OverlayTarget, portalMenuOption } = useSpatialOverlayWeb({
        portalTargetName: 'late-plain-web-target',
      })
      const [visible, setVisible] = React.useState(false)
      showTarget = setVisible

      return (
        <>
          {portalMenuOption(<div data-testid="late-plain-item">Late item</div>)}
          {visible ? <OverlayTarget /> : null}
        </>
      )
    }

    const r = render(<Host />)
    expect(r.queryAllByTestId('late-plain-item')).toHaveLength(0)

    await act(async () => {
      showTarget(true)
    })

    expect(r.getAllByTestId('late-plain-item')).toHaveLength(1)
  })
})
