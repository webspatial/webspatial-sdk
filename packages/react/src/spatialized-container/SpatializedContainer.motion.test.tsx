import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { resetRuntimeCacheForTests } from '@webspatial/core-sdk'

function installFakeRaf() {
  vi.useFakeTimers()
  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: FrameRequestCallback): number =>
      setTimeout(() => cb(performance.now()), 16) as unknown as number,
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    clearTimeout(id)
  })
}

describe('SpatializedContainer degraded xr-animation binding', () => {
  beforeEach(() => {
    vi.resetModules()
    resetRuntimeCacheForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('binds xr-animation to the degraded host so web playback can advance', async () => {
    installFakeRaf()
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
    expect(screen.getByTestId('play-state').textContent).toBe('running')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20)
    })

    expect(Number(host.style.opacity)).toBeGreaterThan(0)
    expect(Number(host.style.opacity)).toBeLessThan(1)
    expect(host.style.transform).not.toContain('40px')
    expect(host.style.transform).not.toContain('0px, 0px, 0px')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(screen.getByTestId('play-state').textContent).toBe('finished')
    expect(host.style.opacity).toBe('1')
    expect(host.style.transform).toContain('0px')
  })
})
