import React from 'react'
import { render, screen } from '@testing-library/react'
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

  test('does not bind xr-animation to the degraded host in plain-web mode', async () => {
    const { Spatialized2DElementContainer } = await import(
      './Spatialized2DElementContainer'
    )

    const motion = {
      __kind: 'spatializedMotion' as const,
      __setElement: vi.fn(),
      __onUnbind: vi.fn(),
    }

    const { unmount } = render(
      React.createElement(
        Spatialized2DElementContainer as any,
        {
          component: 'div',
          'xr-animation': motion,
          'data-testid': 'host',
        },
        'Hello Spatial',
      ),
    )

    const host = screen.getByTestId('host')

    expect(host.textContent).toContain('Hello Spatial')
    expect(host.hasAttribute('xr-animation')).toBe(false)
    expect(motion.__setElement).not.toHaveBeenCalled()
    expect(motion.__onUnbind).not.toHaveBeenCalled()

    unmount()

    expect(motion.__setElement).not.toHaveBeenCalled()
    expect(motion.__onUnbind).not.toHaveBeenCalled()
  })
})
