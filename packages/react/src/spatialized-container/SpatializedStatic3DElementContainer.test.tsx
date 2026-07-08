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
} as { dom?: HTMLElement }
let lastExtraRefProps:
  | ((domProxy: unknown) => Record<string, unknown>)
  | undefined

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
    lastExtraRefProps = props.extraRefProps as typeof lastExtraRefProps
    return (
      <PortalInstanceContext.Provider
        value={portalInstanceValue as unknown as PortalInstanceObject}
      >
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
    lastExtraRefProps = undefined
    IntersectionObserverMock.instances = []
    portalInstanceValue.dom = document.createElement('div')
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

  it('stays lazy when portal dom is missing', () => {
    portalInstanceValue.dom = undefined

    render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    expect(updateProperties).toHaveBeenCalledTimes(1)
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'lazy' }),
    )
    expect(lastObserver()).toBeUndefined()
    expect(updateProperties).not.toHaveBeenCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
  })

  it('attaches observer once portal dom appears and eager only after intersecting', () => {
    portalInstanceValue.dom = undefined

    const { rerender } = render(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    expect(lastObserver()).toBeUndefined()

    portalInstanceValue.dom = document.createElement('div')
    rerender(
      <SpatializedStatic3DElementContainer src="/model.usdz" loading="lazy" />,
    )

    expect(lastObserver()?.observe).toHaveBeenCalledWith(
      portalInstanceValue.dom,
    )
    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'lazy' }),
    )

    act(() => {
      lastObserver()!.trigger(true)
    })

    expect(updateProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ loading: 'eager' }),
    )
  })

  it('resolves ready from the DOM-linked spatialized element when a nested standard branch did not create one', async () => {
    const readyTarget = {
      ready: Promise.resolve(true),
    }

    render(<SpatializedStatic3DElementContainer src="/model.usdz" />)

    const domProxy = Object.assign(document.createElement('div'), {
      __innerSpatializedElement: () => readyTarget,
    })
    const extra = lastExtraRefProps!(domProxy)

    await expect(
      Promise.resolve().then(() => extra.ready),
    ).resolves.toMatchObject({
      type: 'modelloaded',
      currentTarget: domProxy,
      target: domProxy,
    })
  })
})
