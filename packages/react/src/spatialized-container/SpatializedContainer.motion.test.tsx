import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { resetRuntimeCacheForTests } from '@webspatial/core-sdk'

describe('SpatializedContainer degraded xr-animation binding', () => {
  beforeEach(() => {
    vi.resetModules()
    resetRuntimeCacheForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('binds xr-animation to the degraded host without advancing without native support', async () => {
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

    const host = screen.getByTestId('host')
    expect(host.textContent).toContain('Hello Spatial')
    expect(host.style.opacity).toBe('0')
    expect(host.style.transform).toContain('40px')

    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByTestId('play-state').textContent).toBe('idle')
    expect(host.style.opacity).toBe('0')
    expect(host.style.transform).toContain('40px')
  })
})
