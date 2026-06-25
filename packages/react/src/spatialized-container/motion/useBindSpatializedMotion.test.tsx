import { renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useBindSpatializedMotion } from './useBindSpatializedMotion'

function createBinding() {
  return {
    __kind: 'spatializedMotion' as const,
    __propName: 'xr-animation' as const,
    __motionObjectId: 'motion-1',
    get __animating() {
      return false
    },
    __setElement: vi.fn(),
    __onUnbind: vi.fn(),
  }
}

describe('useBindSpatializedMotion', () => {
  test('binds the resolved element once and unbinds through __onUnbind', () => {
    const binding = createBinding()
    const element = { id: 'portal-1' }

    const { unmount } = renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element: element as any,
        kind: 'spatialized2d',
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'spatialized2d')

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
  })

  test('does not rebind when unrelated render inputs change', () => {
    const binding = createBinding()
    const element = { id: 'portal-2' }

    const { rerender, unmount } = renderHook(
      ({ active }) =>
        useBindSpatializedMotion({
          binding: active ? (binding as any) : undefined,
          element: active ? (element as any) : null,
          kind: 'static3d',
        }),
      {
        initialProps: { active: true },
      },
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    rerender({ active: true })

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
  })
})
