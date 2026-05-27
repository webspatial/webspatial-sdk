import { act, render } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let lastObserver: {
  callback: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
} | null = null

/**
 * Mirrors the lazy-loading observer branch in SpatializedStatic3DElementContainer
 * SpatializedContent (wait for portal dom before observing).
 */
function LazyLoadingProbe(props: {
  loading: 'lazy' | 'eager'
  portalInstanceObject: { dom?: HTMLElement }
  onEffectiveLoading: (mode: 'lazy' | 'eager') => void
}) {
  const { loading, portalInstanceObject, onEffectiveLoading } = props
  const [effectiveLoading, setEffectiveLoading] = useState<'lazy' | 'eager'>(
    () => (loading === 'lazy' ? 'lazy' : 'eager'),
  )

  useEffect(() => {
    onEffectiveLoading(effectiveLoading)
  }, [effectiveLoading, onEffectiveLoading])

  useEffect(() => {
    if (effectiveLoading !== 'lazy') return
    const target = portalInstanceObject.dom
    if (!target) {
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      setEffectiveLoading('eager')
      return
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setEffectiveLoading('eager')
        observer.disconnect()
      }
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [effectiveLoading, portalInstanceObject, portalInstanceObject.dom])

  return null
}

describe('SpatializedStatic3D lazy loading before portal dom exists', () => {
  beforeEach(() => {
    lastObserver = null
    class MockIntersectionObserver {
      callback: IntersectionObserverCallback
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        lastObserver = this
      }
      triggerIntersecting() {
        this.callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        )
      }
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stays lazy when portal dom is missing (does not eager-fallback)', () => {
    const onEffectiveLoading = vi.fn()
    const portal = { dom: undefined as HTMLElement | undefined }

    render(
      <LazyLoadingProbe
        loading="lazy"
        portalInstanceObject={portal}
        onEffectiveLoading={onEffectiveLoading}
      />,
    )

    expect(onEffectiveLoading).toHaveBeenLastCalledWith('lazy')
    expect(lastObserver).toBeNull()
  })

  it('attaches observer once dom appears, eager only after intersecting', () => {
    const onEffectiveLoading = vi.fn()
    const portal: { dom?: HTMLElement } = {}

    const { rerender } = render(
      <LazyLoadingProbe
        loading="lazy"
        portalInstanceObject={portal}
        onEffectiveLoading={onEffectiveLoading}
      />,
    )

    expect(onEffectiveLoading).toHaveBeenLastCalledWith('lazy')
    expect(lastObserver).toBeNull()

    portal.dom = document.createElement('div')
    rerender(
      <LazyLoadingProbe
        loading="lazy"
        portalInstanceObject={portal}
        onEffectiveLoading={onEffectiveLoading}
      />,
    )

    expect(lastObserver?.observe).toHaveBeenCalledWith(portal.dom)
    expect(onEffectiveLoading).toHaveBeenLastCalledWith('lazy')

    act(() => {
      ;(lastObserver as any).triggerIntersecting()
    })

    expect(onEffectiveLoading).toHaveBeenLastCalledWith('eager')
  })
})
