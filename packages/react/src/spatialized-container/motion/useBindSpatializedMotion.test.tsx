/* @vitest-environment jsdom */

import { renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('@webspatial/core-sdk', () => ({
  Spatialized2DElement: class Spatialized2DElement {
    /** Identifies the mock motion target kind for runtime binding resolution. */
    readonly kind = 'spatialized2d' as const

    /**
     * Creates a mock runtime 2D element instance for motion binding tests.
     *
     * @param id - Stable identifier used by the test.
     */
    constructor(readonly id: string) {}
  },
  SpatializedStatic3DElement: class SpatializedStatic3DElement {
    /** Identifies the mock motion target kind for runtime binding resolution. */
    readonly kind = 'static3d' as const

    /**
     * Creates a mock runtime static 3D element instance for motion binding
     * tests.
     *
     * @param id - Stable identifier used by the test.
     */
    constructor(readonly id: string) {}
  },
  SpatializedDynamic3DElement: class SpatializedDynamic3DElement {
    /** Identifies the mock motion target kind for runtime binding resolution. */
    readonly kind = 'dynamic3d' as const

    /**
     * Creates a mock runtime dynamic 3D element instance for motion binding
     * tests.
     *
     * @param id - Stable identifier used by the test.
     */
    constructor(readonly id: string) {}
  },
}))

import {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  type SpatializedElement,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import { useBindSpatializedMotion } from './useBindSpatializedMotion'

function createBinding() {
  return {
    __kind: 'spatializedMotion' as const,
    __setElement: vi.fn(),
    __onUnbind: vi.fn(),
  }
}

describe('useBindSpatializedMotion', () => {
  test('resolves Spatialized2DElement to spatialized2d and unbinds on unmount', () => {
    const binding = createBinding()
    const element = new Spatialized2DElement(
      'portal-1',
      window as unknown as WindowProxy,
    )

    const { unmount } = renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element,
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'spatialized2d')

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledTimes(1)
  })

  test('resolves SpatializedStatic3DElement to static3d', () => {
    const binding = createBinding()
    const element = new SpatializedStatic3DElement('model-1')

    renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element,
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'static3d')
  })

  test('resolves SpatializedDynamic3DElement to dynamic3d', () => {
    const binding = createBinding()
    const element = new SpatializedDynamic3DElement('reality-1')

    renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element,
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'dynamic3d')
  })

  test('binds supported elements by kind without relying on instanceof', () => {
    const binding = createBinding()
    const element: SpatializedElement = {
      id: 'kind-only-1',
      kind: 'spatialized2d' as const,
      createAnimation: vi.fn(),
      updateProperties: vi.fn(),
    } as never

    renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element,
      }),
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__setElement).toHaveBeenCalledWith(element, 'spatialized2d')
  })

  test('does not bind HTMLElement targets', () => {
    const binding = createBinding()
    const element = document.createElement('div')

    renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element: element as never,
      }),
    )

    expect(binding.__setElement).not.toHaveBeenCalled()
    expect(binding.__onUnbind).not.toHaveBeenCalled()
  })

  test('does not bind unrecognized objects', () => {
    const binding = createBinding()
    const element = { id: 'unknown-1' }

    renderHook(() =>
      useBindSpatializedMotion({
        binding,
        element: element as never,
      }),
    )

    expect(binding.__setElement).not.toHaveBeenCalled()
    expect(binding.__onUnbind).not.toHaveBeenCalled()
  })

  test('does not rebind when unrelated render inputs change', () => {
    const binding = createBinding()
    const element = new SpatializedStatic3DElement('portal-2')

    const { rerender, unmount } = renderHook(
      ({ active, revision }) => {
        void revision
        useBindSpatializedMotion({
          binding: active ? (binding as any) : undefined,
          element: active ? element : null,
        })
      },
      {
        initialProps: { active: true, revision: 1 },
      },
    )

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    rerender({ active: true, revision: 2 })

    expect(binding.__setElement).toHaveBeenCalledTimes(1)
    expect(binding.__onUnbind).not.toHaveBeenCalled()

    unmount()

    expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
  })
})
