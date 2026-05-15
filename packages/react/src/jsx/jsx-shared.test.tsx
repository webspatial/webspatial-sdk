import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { Reality } from '../reality'

const ENABLE_XR = 'enable-xr'

describe('jsx-shared Reality handling', () => {
  it('does not rewrite Reality into a 2D spatialized container when enable-xr is present', async () => {
    const Wrapped = Symbol('Wrapped')

    vi.doMock('@webspatial/react-sdk', () => ({
      Model: Symbol('Model'),
      Reality,
      withSpatialMonitor: vi.fn(),
      withSpatialized2DElementContainer: vi.fn(() => Wrapped),
    }))

    const { replaceToSpatialPrimitiveType } = await import('./jsx-shared')
    const props = { [ENABLE_XR]: true }

    expect(replaceToSpatialPrimitiveType(Reality, props)).toBe(Reality)
    expect(props).toHaveProperty(ENABLE_XR, true)
  })

  it('strips enable-xr before Reality forwards props to its host element', () => {
    const { getByTestId } = render(
      React.createElement(Reality, {
        [ENABLE_XR]: true,
        'data-testid': 'reality-host',
      } as React.ComponentProps<typeof Reality> & { 'data-testid': string }),
    )

    expect(getByTestId('reality-host').getAttribute(ENABLE_XR)).toBeNull()
  })
})
