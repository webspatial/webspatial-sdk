import React from 'react'
import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SpatializedStatic3DElementContainer } from './SpatializedStatic3DElementContainer'
import {
  PortalInstanceContext,
  PortalInstanceObject,
} from './context/PortalInstanceContext'

type LoadingMode = 'lazy' | 'eager'

type UpdatePropertiesPayload = {
  loading?: LoadingMode
  modelURL?: string
  sources?: Array<{ src: string; type?: string }>
  autoplay?: boolean
  loop?: boolean
  posterURL?: string
}

type SpatializedElementStub = {
  updateProperties: (payload: UpdatePropertiesPayload) => void
  modelUrl: string
}

const updateProperties = vi.fn<(payload: UpdatePropertiesPayload) => void>()
const spatializedElement: SpatializedElementStub = {
  updateProperties,
  modelUrl: '',
}
const portalInstanceValue = {
  dom: document.createElement('div'),
} as unknown as PortalInstanceObject

vi.mock('@webspatial/core-sdk', () => ({
  SpatializedStatic3DElement: class {},
}))

vi.mock('./SpatializedContainer', () => ({
  SpatializedContainer: ({
    spatializedContent: Content,
    ...props
  }: {
    spatializedContent: React.ComponentType<Record<string, unknown>>
  } & Record<string, unknown>) => {
    return (
      <PortalInstanceContext.Provider value={portalInstanceValue}>
        <Content {...props} spatializedElement={spatializedElement} />
      </PortalInstanceContext.Provider>
    )
  },
}))

type TestEntry = Pick<IntersectionObserverEntry, 'isIntersecting'>

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = []

  callback: (entries: TestEntry[]) => void
  observe = vi.fn<(target: Element) => void>()
  disconnect = vi.fn<() => void>()

  constructor(callback: (entries: TestEntry[]) => void) {
    this.callback = callback
    IntersectionObserverMock.instances.push(this)
  }

  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting }])
  }
}

function lastObserver() {
  return IntersectionObserverMock.instances.at(-1)
}

describe('SpatializedStatic3DElementContainer lazy/eager loading behavior', () => {
  beforeEach(() => {
    updateProperties.mockClear()
    IntersectionObserverMock.instances = []
    globalThis.IntersectionObserver =
      IntersectionObserverMock as unknown as typeof IntersectionObserver
  })

  it('does not load until visible when loading="lazy"', () => {
    render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    expect(updateProperties).toHaveBeenCalledTimes(1)
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'lazy' }),
    )

    expect(lastObserver()).toBeDefined()
    expect(updateProperties).not.toHaveBeenCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
  })

  it('loads immediately when loading is eager or undefined', () => {
    const { rerender } = render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="eager" />,
    )
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )

    rerender(<SpatializedStatic3DElementContainer src="/model2.usdz" />)
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
  })

  it('loads immediately when switching loading from lazy to eager', () => {
    const { rerender } = render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    rerender(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="eager" />,
    )
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
  })

  it('keeps eager when switching from eager to lazy', () => {
    const { rerender } = render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="eager" />,
    )
    updateProperties.mockClear()

    rerender(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    expect(updateProperties).toHaveBeenCalledTimes(1)
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
    expect(updateProperties).not.toHaveBeenCalledWith(
      expect.objectContaining({ loading: 'lazy' }),
    )
  })

  it('for lazy: loads on visible; when hidden and src changes, waits until visible again', () => {
    const { rerender } = render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    act(() => {
      lastObserver()!.trigger(true)
    })
    expect(updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )

    updateProperties.mockClear()
    rerender(
      <SpatializedStatic3DElementContainer src="/model2.usdz" loading="lazy" />,
    )
    expect(updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({ loading: 'lazy' }),
    )
    expect(updateProperties).not.toHaveBeenCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )

    act(() => {
      lastObserver()!.trigger(true)
    })
    expect(updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
  })

  it('loads immediately when switching from lazy to undefined', () => {
    const { rerender } = render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    rerender(<SpatializedStatic3DElementContainer src="/model.usdz" />)
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
  })
})
