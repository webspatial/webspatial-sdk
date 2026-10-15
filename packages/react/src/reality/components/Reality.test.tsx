/* @vitest-environment jsdom */

import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Reality } from './Reality'

const spatializedContainerPropsMock = vi.fn()

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
        <div data-testid="spatialized-content">
          {SpatializedContent ? (
            <SpatializedContent
              spatializedElement={{}}
              portalInstanceObject={{}}
            />
          ) : null}
        </div>
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
  test('forwards xr-animation to SpatializedContainer and keeps portal content empty', async () => {
    const xrAnimation = { __kind: 'spatializedMotion' }

    const { getByTestId } = render(
      <Reality xr-animation={xrAnimation as any} />,
    )

    const containerCall = spatializedContainerPropsMock.mock.calls.at(
      -1,
    )?.[0] as Record<string, unknown> | undefined

    expect(containerCall?.['xr-animation']).toBe(xrAnimation)
    expect(getByTestId('spatialized-content').innerHTML).toBe('')
  })
})
