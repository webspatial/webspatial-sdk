import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Reality } from './Reality'

const useBindSpatializedMotionMock = vi.fn()
const setSuppressedFieldsMock = vi.fn()
const setTerminalTransformOwnerMock = vi.fn()
const portalInstanceObject = {
  setSuppressedFields: setSuppressedFieldsMock,
  setTerminalTransformOwner: setTerminalTransformOwnerMock,
}

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
      portalInstanceObject: {
        setSuppressedFields: typeof setSuppressedFieldsMock
        setTerminalTransformOwner: typeof setTerminalTransformOwnerMock
      }
    }>
  }) => (
    <div data-testid="spatialized-container">
      {SpatializedContent ? (
        <SpatializedContent
          spatializedElement={{}}
          portalInstanceObject={portalInstanceObject}
        />
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
  test('bridges suppression updates to the current portal instance for dynamic3d root motion', async () => {
    const xrAnimation = { __kind: 'spatializedMotion' }

    render(<Reality xr-animation={xrAnimation as any} />)

    await waitFor(() => {
      const bindCall = useBindSpatializedMotionMock.mock.calls.at(-1)?.[0] as
        | {
            onSuppressedFieldsChange?: (
              suppressedFields: Set<string> | null,
            ) => void
          }
        | undefined

      expect(bindCall?.onSuppressedFieldsChange).toBeTypeOf('function')

      bindCall?.onSuppressedFieldsChange?.(new Set(['transform']))
    })

    expect(setSuppressedFieldsMock).toHaveBeenCalledWith(new Set(['transform']))
  })

  test('bridges terminal transform ownership updates to the current portal instance for dynamic3d root motion', async () => {
    const xrAnimation = { __kind: 'spatializedMotion' }

    render(<Reality xr-animation={xrAnimation as any} />)

    await waitFor(() => {
      const bindCall = useBindSpatializedMotionMock.mock.calls.at(-1)?.[0] as
        | {
            onTerminalTransformOwnerChange?: (
              owner: 'authored' | 'native' | null,
            ) => void
          }
        | undefined

      expect(bindCall?.onTerminalTransformOwnerChange).toBeTypeOf('function')

      bindCall?.onTerminalTransformOwnerChange?.('native')
    })

    expect(setTerminalTransformOwnerMock).toHaveBeenCalledWith('native')
  })
})
