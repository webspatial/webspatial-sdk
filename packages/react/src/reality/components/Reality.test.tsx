import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Reality } from './Reality'

const useBindSpatializedMotionMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

vi.mock('../../spatialized-container/SpatializedContainer', () => ({
  SpatializedContainer: ({
    children,
    spatializedContent: SpatializedContent,
  }: {
    children?: React.ReactNode
    spatializedContent?: React.ComponentType<{
      spatializedElement: unknown
      portalInstanceObject: Record<string, never>
    }>
  }) => (
    <div data-testid="spatialized-container">
      {SpatializedContent ? (
        <SpatializedContent spatializedElement={{}} portalInstanceObject={{}} />
      ) : null}
      {children}
    </div>
  ),
}))

vi.mock('../../spatialized-container/motion/useBindSpatializedMotion', () => ({
  useBindSpatializedMotion: (options: unknown) =>
    useBindSpatializedMotionMock(options),
}))

vi.mock('../context/InsideAttachmentContext', () => ({
  useInsideAttachment: () => false,
}))

vi.mock('../hooks', () => ({
  useRealityEvents: vi.fn(),
}))

describe('Reality', () => {
  test('binds dynamic3d root motion without portal suppression callbacks', async () => {
    const xrAnimation = { __kind: 'spatializedMotion' }

    render(<Reality xr-animation={xrAnimation as any} />)

    const bindCall = useBindSpatializedMotionMock.mock.calls.at(-1)?.[0] as
      | Record<string, unknown>
      | undefined

    expect(bindCall?.binding).toBe(xrAnimation)
    expect(bindCall?.kind).toBe('dynamic3d')
    expect(bindCall).not.toHaveProperty('onSuppressedFieldsChange')
    expect(bindCall).not.toHaveProperty('onMotionFieldMetadataChange')
  })
})
