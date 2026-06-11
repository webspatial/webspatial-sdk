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
    __getSuppressedFields: vi.fn(() => new Set(['transform'])),
    __setElement: vi.fn(),
    __onUnbind: vi.fn(),
  }
}

describe('useBindSpatializedMotion', () => {
  test('binds static3d targets and cleans up through __onUnbind only', () => {
    const binding = createBinding()
    const element = { id: 'model-1' }

    const { unmount } = renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element: element as any,
        kind: 'static3d',
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'static3d')

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
  })

  test('inactive cleanup only unbinds and clears suppressed fields for spatialized2d bindings', () => {
    const binding = createBinding()
    const element = { id: 'portal-1' }
    const onSuppressedFieldsChange = vi.fn()

    const { rerender, unmount } = renderHook(
      ({ active }) =>
        useBindSpatializedMotion({
          binding: active ? (binding as any) : undefined,
          element: active ? (element as any) : null,
          kind: 'spatialized2d',
          onSuppressedFieldsChange,
        }),
      {
        initialProps: { active: true },
      },
    )

    expect(onSuppressedFieldsChange).toHaveBeenCalledWith(
      new Set(['transform']),
    )
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'spatialized2d')

    rerender({ active: false })

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(onSuppressedFieldsChange).toHaveBeenLastCalledWith(null)

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
  })

  test('does not unbind and rebind when only the suppressed-fields callback changes', () => {
    const binding = createBinding()
    const element = { id: 'portal-2' }
    const firstCallback = vi.fn()
    const secondCallback = vi.fn()

    const { rerender, unmount } = renderHook(
      ({ callback }) =>
        useBindSpatializedMotion({
          binding: binding as any,
          element: element as any,
          kind: 'spatialized2d',
          onSuppressedFieldsChange: callback,
        }),
      {
        initialProps: { callback: firstCallback },
      },
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    rerender({ callback: secondCallback })

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
  })

  test('cleanup does not call __setElement(null) after __onUnbind', () => {
    const binding = createBinding()
    const element = { id: 'portal-1' }

    const { unmount } = renderHook(() =>
      useBindSpatializedMotion({
        binding: binding as any,
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
})
