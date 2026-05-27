import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SpatializedElement } from '@webspatial/core-sdk'
import { useSpatialContentReady } from './useSpatialContentReady'

describe('useSpatialContentReady', () => {
  it('does not throw when portalInstanceObject is null (HMR teardown)', () => {
    const onSpatialContentReady = vi.fn()

    expect(() =>
      renderHook(() =>
        useSpatialContentReady({
          spatializedElement: undefined,
          portalInstanceObject: null,
          hostElement: null,
          onSpatialContentReady,
        }),
      ),
    ).not.toThrow()

    expect(onSpatialContentReady).not.toHaveBeenCalled()
  })

  it('accepts portalInstanceObject from props without context', () => {
    const portal = { dom: undefined } as { dom: HTMLElement | undefined }
    const onSpatialContentReady = vi.fn()

    expect(() =>
      renderHook(() =>
        useSpatialContentReady({
          spatializedElement: {} as SpatializedElement,
          portalInstanceObject: portal as never,
          hostElement: null,
          onSpatialContentReady,
        }),
      ),
    ).not.toThrow()
  })

  it('re-runs safely when portalInstanceObject transitions null → object', () => {
    const onSpatialContentReady = vi.fn()
    const portal = { dom: undefined } as { dom: HTMLElement | undefined }

    const { rerender } = renderHook(
      ({
        portalInstanceObject,
      }: {
        portalInstanceObject: typeof portal | null
      }) =>
        useSpatialContentReady({
          spatializedElement: {} as SpatializedElement,
          portalInstanceObject,
          hostElement: null,
          onSpatialContentReady,
        }),
      { initialProps: { portalInstanceObject: null as typeof portal | null } },
    )

    rerender({ portalInstanceObject: portal })
    rerender({ portalInstanceObject: null })

    expect(onSpatialContentReady).not.toHaveBeenCalled()
  })
})
