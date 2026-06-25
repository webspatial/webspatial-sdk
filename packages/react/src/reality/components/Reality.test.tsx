/* @vitest-environment jsdom */

import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Reality } from './Reality'

const spatializedContainerPropsMock = vi.fn()
const portalInstanceObject = {}

beforeEach(() => {
  vi.clearAllMocks()
})

vi.mock('../../spatialized-container/SpatializedContainer', () => ({
  SpatializedContainer: (props: {
    children?: React.ReactNode
    spatializedContent?: React.ComponentType<{
      spatializedElement: unknown
      portalInstanceObject: Record<string, never>
    }>
    'xr-animation'?: unknown
  }) => {
    const { children, spatializedContent: SpatializedContent } = props
    spatializedContainerPropsMock(props)

    return (
      <div data-testid="spatialized-container">
        {SpatializedContent ? (
          <SpatializedContent
            spatializedElement={{}}
            portalInstanceObject={portalInstanceObject as Record<string, never>}
          />
        ) : null}
        {children}
      </div>
    )
  },
}))

vi.mock('../context/InsideAttachmentContext', () => ({
  useInsideAttachment: () => false,
}))

vi.mock('../hooks', () => ({
  useRealityEvents: vi.fn(),
}))

describe('Reality', () => {
  test('forwards xr-animation to SpatializedContainer without portal suppression callbacks', async () => {
    const xrAnimation = { __kind: 'spatializedMotion' }

    render(<Reality xr-animation={xrAnimation as any} />)

    const containerCall = spatializedContainerPropsMock.mock.calls.at(
      -1,
    )?.[0] as Record<string, unknown> | undefined

    expect(containerCall?.['xr-animation']).toBe(xrAnimation)
    expect(containerCall).not.toHaveProperty('onSuppressedFieldsChange')
    expect(containerCall).not.toHaveProperty('onMotionFieldMetadataChange')
  })
})
