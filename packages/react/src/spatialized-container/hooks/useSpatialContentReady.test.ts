import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SpatializedElement } from '@webspatial/core-sdk'
import type { PortalInstanceObject } from '../context/PortalInstanceContext'
import { useSpatialContentReady } from './useSpatialContentReady'

function mockPortal(dom?: HTMLElement): PortalInstanceObject {
  return { dom } as unknown as PortalInstanceObject
}

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
    const portal = mockPortal()
    const onSpatialContentReady = vi.fn()

    expect(() =>
      renderHook(() =>
        useSpatialContentReady({
          spatializedElement: {} as SpatializedElement,
          portalInstanceObject: portal,
          hostElement: null,
          onSpatialContentReady,
        }),
      ),
    ).not.toThrow()
  })

  it('re-runs safely when portalInstanceObject transitions null → object', () => {
    const onSpatialContentReady = vi.fn()
    const portal = mockPortal()

    const { rerender } = renderHook(
      ({
        portalInstanceObject,
      }: {
        portalInstanceObject: PortalInstanceObject | null
      }) =>
        useSpatialContentReady({
          spatializedElement: {} as SpatializedElement,
          portalInstanceObject,
          hostElement: null,
          onSpatialContentReady,
        }),
      {
        initialProps: {
          portalInstanceObject: null as PortalInstanceObject | null,
        },
      },
    )

    rerender({ portalInstanceObject: portal as PortalInstanceObject | null })
    rerender({ portalInstanceObject: null })

    expect(onSpatialContentReady).not.toHaveBeenCalled()
  })
})
