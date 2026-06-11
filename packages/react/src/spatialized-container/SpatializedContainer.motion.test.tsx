import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { resetRuntimeCacheForTests } from '@webspatial/core-sdk'

describe('SpatializedContainer degraded xr-animation binding', () => {
  beforeEach(() => {
    vi.resetModules()
    resetRuntimeCacheForTests()
  })

  test('binds xr-animation to the degraded host so web playback can advance', async () => {
    const { Spatialized2DElementContainer } = await import(
      './Spatialized2DElementContainer'
    )
    const { useAnimation } = await import('./motion/useAnimation')

    function TestPage() {
      const [motion, api, style] = useAnimation({
        from: {
          opacity: 0,
          transform: { translate: { y: 40 } },
        },
        to: {
          opacity: 1,
          transform: { translate: { y: 0 } },
        },
        duration: 0.05,
        timingFunction: 'linear',
        autoStart: true,
      })

      return (
        <>
          {React.createElement(
            Spatialized2DElementContainer as any,
            {
              component: 'div',
              'xr-animation': motion,
              style,
              'data-testid': 'host',
            },
            'Hello Spatial',
          )}
          <output data-testid="play-state">{api.playState}</output>
        </>
      )
    }

    render(<TestPage />)

    const host = await screen.findByTestId('host')
    expect(host.textContent).toContain('Hello Spatial')

    await waitFor(() => {
      expect(host.style.opacity).toBe('0')
      expect(host.style.transform).toContain('40px')
    })

    await waitFor(
      () => {
        expect(screen.getByTestId('play-state').textContent).toBe('running')
        expect(Number(host.style.opacity)).toBeGreaterThan(0)
      },
      { timeout: 1000 },
    )

    await waitFor(
      () => {
        expect(screen.getByTestId('play-state').textContent).toBe('finished')
        expect(host.style.opacity).toBe('1')
        expect(host.style.transform).toContain('0px')
      },
      { timeout: 1500 },
    )
  })
})
