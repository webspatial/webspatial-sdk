import { describe, expect, it, vi } from 'vitest'
import React, { useRef } from 'react'
import { act, render } from '@testing-library/react'
import {
  SpatialStyleInfoUpdateEvent,
  notifyDOMUpdate,
  notifyUpdateStandInstanceLayout,
} from './notifyUpdateStandInstanceLayout'
import { SpatializedContainerContext } from './spatialized-container/context/SpatializedContainerContext'
import { use2DFrameDetector } from './spatialized-container/hooks/use2DFrameDetector'
import { useSpatialTransformVisibility } from './spatialized-container/hooks/useSpatialTransformVisibility'
import { useSync2DFrame } from './spatialized-container/hooks/useSync2DFrame'
import {
  useSpatialEventsBase,
  useSpatialEventsWhenSpatializedContainerExist,
} from './spatialized-container/hooks/useSpatialEvents'
import {
  extractAndRemoveCustomProperties,
  getInheritedStyleProps,
  joinToCSSText,
  parseCornerRadius,
  parseTransformOrigin,
  splitCSSText,
} from './spatialized-container/utils'
import { convertDOMRectToSceneSpace } from './spatialized-container/transform-utils'
import { shallowEqualRotation, shallowEqualVec3 } from './reality/utils/equal'
import { AbortResourceManager } from './reality/utils/AbortResourceManager'
import { ResourceRegistry } from './reality/utils/ResourceRegistry'
import {
  StandardSpatializedContainer,
  injectSpatialDefaultStyle,
} from './spatialized-container/StandardSpatializedContainer'
import { SpatialID } from './spatialized-container/SpatialID'
import {
  initCSSParserDivContainer,
  TransformVisibilityTaskContainer,
} from './spatialized-container/TransformVisibilityTaskContainer'
import { useMonitorDomChange } from './spatialized-container-monitor/useMonitorDomChange'
import { useMonitorDocumentHeaderChange } from './spatialized-container-monitor/useMonitorDocumentHeaderChange'
import { SpatialMonitor } from './spatialized-container-monitor/SpatialMonitor'
import { withSpatialMonitor } from './spatialized-container-monitor/withSpatialMonitor'

if (!(globalThis as any).DOMPoint) {
  ;(globalThis as any).DOMPoint = class DOMPointPolyfill {
    constructor(
      public x = 0,
      public y = 0,
      public z = 0,
      public w = 1,
    ) {}
  }
}

if (!(globalThis as any).DOMMatrix) {
  ;(globalThis as any).DOMMatrix = class DOMMatrixPolyfill {
    private tx = 0
    private ty = 0
    private tz = 0

    translate(x = 0, y = 0, z = 0) {
      this.tx += x
      this.ty += y
      this.tz += z
      return this
    }

    transformPoint(p: { x: number; y: number; z?: number }) {
      return new (globalThis as any).DOMPoint(
        p.x + this.tx,
        p.y + this.ty,
        (p.z ?? 0) + this.tz,
      )
    }

    static fromMatrix(other: any) {
      const m = new DOMMatrixPolyfill()
      if (other) {
        m.tx = other.tx || 0
        m.ty = other.ty || 0
        m.tz = other.tz || 0
      }
      return m
    }
  }
}

if (!(globalThis as any).DOMMatrixReadOnly) {
  ;(globalThis as any).DOMMatrixReadOnly = (globalThis as any).DOMMatrix
}

describe('spatialized-container/utils', () => {
  it('getInheritedStyleProps returns only truthy inherited properties', () => {
    const computedStyle = {
      color: 'red',
      width: '100px',
      height: '',
      position: 'absolute',
      display: 'block',
    } as unknown as CSSStyleDeclaration

    expect(getInheritedStyleProps(computedStyle)).toEqual(
      expect.objectContaining({
        color: 'red',
        width: '100px',
        position: 'absolute',
        display: 'block',
      }),
    )
    expect(getInheritedStyleProps(computedStyle)).not.toHaveProperty('height')
  })

  it('parseTransformOrigin returns normalized anchor', () => {
    const computedStyle = {
      getPropertyValue: (prop: string) => {
        if (prop === 'transform-origin') return '20px 50px 0px'
        if (prop === 'width') return '100px'
        if (prop === 'height') return '200px'
        return ''
      },
    } as unknown as CSSStyleDeclaration

    expect(parseTransformOrigin(computedStyle)).toEqual({
      x: 0.2,
      y: 0.25,
      z: 0.5,
    })
  })

  it('parseTransformOrigin falls back to 0.5 when width or height is 0', () => {
    const computedStyle = {
      getPropertyValue: (prop: string) => {
        if (prop === 'transform-origin') return '0px 0px 0px'
        if (prop === 'width') return '0px'
        if (prop === 'height') return '0px'
        return ''
      },
    } as unknown as CSSStyleDeclaration

    expect(parseTransformOrigin(computedStyle)).toEqual({
      x: 0.5,
      y: 0.5,
      z: 0.5,
    })
  })

  it('parseCornerRadius parses px and percent values', () => {
    const computedStyle = {
      getPropertyValue: (prop: string) => {
        if (prop === 'width') return '200px'
        if (prop === 'border-top-left-radius') return '10px'
        if (prop === 'border-top-right-radius') return '5%'
        if (prop === 'border-bottom-left-radius') return ''
        if (prop === 'border-bottom-right-radius') return '20'
        return ''
      },
    } as unknown as CSSStyleDeclaration

    expect(parseCornerRadius(computedStyle)).toEqual({
      topLeading: 10,
      topTrailing: 10,
      bottomLeading: 0,
      bottomTrailing: 20,
    })
  })

  it('extractAndRemoveCustomProperties extracts specified keys and filters css text', () => {
    const cssText = 'color: red; --a: 1; width: 10px; --b: 2;'
    const { extractedValues, filteredCssText } =
      extractAndRemoveCustomProperties(cssText, ['--a', '--b'])
    expect(extractedValues).toEqual({ '--a': '1', '--b': '2' })
    expect(filteredCssText.replace(/\s/g, '')).toBe('color:red;width:10px;')
  })
  it('splitCSSText and joinToCSSText roundtrip', () => {
    expect(splitCSSText('a: 1; b: 2; ;')).toEqual(['a: 1', ' b: 2'])
    expect(joinToCSSText({ a: '1', b: '2' })).toBe('a: 1;b: 2')
  })
})

describe('spatialized-container/transform-utils', () => {
  it('convertDOMRectToSceneSpace keeps rect with identity matrix', () => {
    const rect = new DOMRect(10, 20, 30, 40)
    const out = convertDOMRectToSceneSpace(rect, new DOMMatrix())
    expect(out.x).toBe(10)
    expect(out.y).toBe(20)
    expect(out.width).toBe(30)
    expect(out.height).toBe(40)
  })

  it('convertDOMRectToSceneSpace translates rect', () => {
    const rect = new DOMRect(10, 20, 30, 40)
    const matrix = new DOMMatrix().translate(5, -3)
    const out = convertDOMRectToSceneSpace(rect, matrix)
    expect(out.x).toBe(15)
    expect(out.y).toBe(17)
    expect(out.width).toBe(30)
    expect(out.height).toBe(40)
  })
})

describe('reality/utils/equal', () => {
  it('shallowEqualVec3 compares by reference or x/y/z', () => {
    const a = { x: 1, y: 2, z: 3 }
    expect(shallowEqualVec3(a, a)).toBe(true)
    expect(shallowEqualVec3(a, { x: 1, y: 2, z: 3 })).toBe(true)
    expect(shallowEqualVec3(a, { x: 1, y: 2, z: 4 })).toBe(false)
    expect(shallowEqualVec3(a, undefined)).toBe(false)
  })

  it('shallowEqualRotation supports vec3 and vec4', () => {
    expect(
      shallowEqualRotation({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 }),
    ).toBe(true)
    expect(
      shallowEqualRotation(
        { x: 1, y: 2, z: 3, w: 4 },
        { x: 1, y: 2, z: 3, w: 4 },
      ),
    ).toBe(true)
    expect(
      shallowEqualRotation(
        { x: 1, y: 2, z: 3, w: 4 },
        { x: 1, y: 2, z: 3, w: 5 },
      ),
    ).toBe(false)
  })
})

describe('reality/utils/AbortResourceManager', () => {
  it('disposes all tracked resources', async () => {
    const controller = new AbortController()
    const mgr = new AbortResourceManager(controller.signal)
    const destroy = vi.fn()
    await mgr.addResource(async () => ({ destroy }))
    await mgr.dispose()
    expect(destroy).toHaveBeenCalledTimes(1)
  })

  it('aborts during creation destroys resource and rejects', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const mgr = new AbortResourceManager(controller.signal)
    const destroy = vi.fn().mockResolvedValue(undefined)
    const createPromise = mgr.addResource(
      () =>
        new Promise<{ destroy: () => Promise<void> }>(resolve => {
          setTimeout(() => resolve({ destroy }), 10)
        }),
    )

    const assertion = expect(createPromise).rejects.toMatchObject({
      name: 'AbortError',
    })
    controller.abort()
    await vi.advanceTimersByTimeAsync(10)
    await assertion
    expect(destroy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('dispose continues on destroy failure', async () => {
    const controller = new AbortController()
    const mgr = new AbortResourceManager(controller.signal)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mgr.addResource(async () => ({
      destroy: vi.fn().mockRejectedValue(new Error('fail')),
    }))
    await mgr.dispose()
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe('reality/utils/ResourceRegistry', () => {
  it('removeAndDestroy destroys after promise resolves', async () => {
    const registry = new ResourceRegistry()
    let resolveResource!: (value: any) => void
    const destroy = vi.fn().mockResolvedValue(undefined)
    const p = new Promise<any>(resolve => {
      resolveResource = resolve
    })

    registry.add('a', p as any)
    registry.removeAndDestroy('a')
    resolveResource({ destroy })
    await Promise.resolve()
    expect(destroy).toHaveBeenCalledTimes(1)
  })

  it('destroy clears registry and destroys all resources', async () => {
    const registry = new ResourceRegistry()
    const destroy1 = vi.fn().mockResolvedValue(undefined)
    const destroy2 = vi.fn().mockResolvedValue(undefined)
    registry.add('a', Promise.resolve({ destroy: destroy1 }) as any)
    registry.add('b', Promise.resolve({ destroy: destroy2 }) as any)

    registry.destroy()
    await Promise.resolve()
    await Promise.resolve()
    expect(destroy1).toHaveBeenCalledTimes(1)
    expect(destroy2).toHaveBeenCalledTimes(1)
  })
})

describe('notifyUpdateStandInstanceLayout', () => {
  it('dispatches standInstanceLayout and domUpdated events', () => {
    const standListener = vi.fn()
    const domListener = vi.fn()
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.standInstanceLayout,
      standListener,
    )
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      domListener,
    )

    notifyUpdateStandInstanceLayout()
    notifyDOMUpdate([] as any)

    expect(standListener).toHaveBeenCalledTimes(1)
    expect(domListener).toHaveBeenCalledTimes(1)

    document.removeEventListener(
      SpatialStyleInfoUpdateEvent.standInstanceLayout,
      standListener,
    )
    document.removeEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      domListener,
    )
  })
})

describe('spatialized-container/hooks', () => {
  it('use2DFrameDetector notifies and wires observers/listeners', () => {
    const notify2DFramePlaceHolderChange = vi.fn()
    const spatializedContainerObject = {
      notify2DFramePlaceHolderChange,
    } as any

    const originalResizeObserver = (globalThis as any).ResizeObserver
    const originalMutationObserver = (globalThis as any).MutationObserver

    const resizeObservers: any[] = []
    const mutationObservers: any[] = []

    ;(globalThis as any).ResizeObserver = class {
      callback: (entries: any[]) => void
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(callback: (entries: any[]) => void) {
        this.callback = callback
        resizeObservers.push(this)
      }
    }
    ;(globalThis as any).MutationObserver = class {
      callback: (mutations: any[]) => void
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(callback: (mutations: any[]) => void) {
        this.callback = callback
        mutationObservers.push(this)
      }
    }

    function Test() {
      const ref = useRef<HTMLDivElement | null>(null)
      use2DFrameDetector(ref as any)
      return React.createElement('div', { ref })
    }

    const r = render(
      React.createElement(
        SpatializedContainerContext.Provider,
        { value: spatializedContainerObject },
        React.createElement(Test),
      ),
    )

    expect(notify2DFramePlaceHolderChange).toHaveBeenCalledTimes(1)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(notify2DFramePlaceHolderChange).toHaveBeenCalledTimes(2)

    act(() => {
      resizeObservers[0].callback([])
      mutationObservers[0].callback([])
    })
    expect(notify2DFramePlaceHolderChange).toHaveBeenCalledTimes(4)

    r.unmount()
    expect(resizeObservers[0].disconnect).toHaveBeenCalledTimes(1)
    expect(mutationObservers[0].disconnect).toHaveBeenCalledTimes(1)
    ;(globalThis as any).ResizeObserver = originalResizeObserver
    ;(globalThis as any).MutationObserver = originalMutationObserver
  })

  it('useSync2DFrame registers callback and updates when fired', () => {
    const portalInstanceObject = {
      notify2DFrameChange: vi.fn(),
    } as any

    let handler: (() => void) | undefined
    const spatializedContainerObject = {
      on2DFrameChange: vi.fn((spatialId: string, cb: () => void) => {
        handler = cb
      }),
      off2DFrameChange: vi.fn(),
    } as any

    let renders = 0
    function Test() {
      renders += 1
      useSync2DFrame('s1', portalInstanceObject, spatializedContainerObject)
      return null
    }

    const r = render(React.createElement(Test))
    expect(spatializedContainerObject.on2DFrameChange).toHaveBeenCalledTimes(1)

    act(() => {
      handler?.()
    })

    expect(portalInstanceObject.notify2DFrameChange).toHaveBeenCalledTimes(1)
    expect(renders).toBeGreaterThan(1)

    r.unmount()
    expect(spatializedContainerObject.off2DFrameChange).toHaveBeenCalledWith(
      's1',
    )
  })

  it('useSpatialTransformVisibility syncs styles and reacts to domUpdated events', () => {
    const updateSpatialTransformVisibility = vi.fn()
    const spatializedContainerObject = {
      updateSpatialTransformVisibility,
    } as any

    const originalMutationObserver = (globalThis as any).MutationObserver
    const observers: any[] = []
    ;(globalThis as any).MutationObserver = class {
      callback: (mutations: any[]) => void
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(callback: (mutations: any[]) => void) {
        this.callback = callback
        observers.push(this)
      }
    }

    function Test() {
      const ref = useRef<HTMLDivElement | null>(null)
      useSpatialTransformVisibility('sid', ref as any)
      return React.createElement('div', {
        ref,
        style: { visibility: 'hidden', transform: 'translateX(1px)' },
      })
    }

    const r = render(
      React.createElement(
        SpatializedContainerContext.Provider,
        { value: spatializedContainerObject },
        React.createElement(Test),
      ),
    )

    expect(updateSpatialTransformVisibility).toHaveBeenCalledTimes(1)
    const first = updateSpatialTransformVisibility.mock.calls[0]?.[1]
    expect(first.visibility).toBe('hidden')
    expect(String(first.transform)).toContain('translate')

    act(() => {
      document.dispatchEvent(new Event(SpatialStyleInfoUpdateEvent.domUpdated))
      observers.forEach(o => o.callback([]))
    })

    expect(updateSpatialTransformVisibility).toHaveBeenCalledTimes(
      2 + observers.length,
    )

    r.unmount()
    observers.forEach(o => {
      expect(o.disconnect).toHaveBeenCalledTimes(1)
    })
    ;(globalThis as any).MutationObserver = originalMutationObserver
  })
})

describe('spatialized-container-monitor', () => {
  it('useMonitorDomChange forwards ref and dispatches domUpdated', () => {
    const originalMutationObserver = (globalThis as any).MutationObserver
    const observers: any[] = []

    ;(globalThis as any).MutationObserver = class {
      callback: (mutations: any[]) => void
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(callback: (mutations: any[]) => void) {
        this.callback = callback
        observers.push(this)
      }
    }

    const forwarded = { current: null as HTMLElement | null }

    let lastEvent: any
    const listener = (e: any) => {
      lastEvent = e
    }
    document.addEventListener(SpatialStyleInfoUpdateEvent.domUpdated, listener)

    function Test() {
      const proxyRef = useMonitorDomChange(forwarded)
      return React.createElement('div', { ref: proxyRef as any })
    }

    const r = render(React.createElement(Test))

    expect(forwarded.current).toBeInstanceOf(HTMLElement)
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toHaveBeenCalledTimes(1)

    act(() => {
      observers[0].callback([{ type: 'attributes' }])
    })
    expect(lastEvent?.type).toBe(SpatialStyleInfoUpdateEvent.domUpdated)
    expect(lastEvent?.detail).toEqual([{ type: 'attributes' }])

    r.unmount()
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
    document.removeEventListener(
      SpatialStyleInfoUpdateEvent.domUpdated,
      listener,
    )
    ;(globalThis as any).MutationObserver = originalMutationObserver
  })

  it('useMonitorDocumentHeaderChange dispatches standInstanceLayout', () => {
    const originalMutationObserver = (globalThis as any).MutationObserver
    const observers: any[] = []

    ;(globalThis as any).MutationObserver = class {
      callback: (mutations: any[]) => void
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(callback: (mutations: any[]) => void) {
        this.callback = callback
        observers.push(this)
      }
    }

    let calls = 0
    const listener = () => {
      calls += 1
    }
    document.addEventListener(
      SpatialStyleInfoUpdateEvent.standInstanceLayout,
      listener,
    )

    function Test() {
      useMonitorDocumentHeaderChange()
      return null
    }

    const r = render(React.createElement(Test))
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toHaveBeenCalledTimes(1)

    act(() => {
      observers[0].callback([{ type: 'childList' }])
    })
    expect(calls).toBe(1)

    r.unmount()
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
    document.removeEventListener(
      SpatialStyleInfoUpdateEvent.standInstanceLayout,
      listener,
    )
    ;(globalThis as any).MutationObserver = originalMutationObserver
  })

  it('SpatialMonitor renders element and wires both monitors', () => {
    const originalMutationObserver = (globalThis as any).MutationObserver
    const observers: any[] = []

    ;(globalThis as any).MutationObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(public callback: (mutations: any[]) => void) {
        observers.push(this)
      }
    }

    const r = render(React.createElement(SpatialMonitor, { El: 'section' }))
    expect(document.querySelector('section')).toBeTruthy()
    expect(observers.length).toBeGreaterThanOrEqual(2)

    r.unmount()
    observers.forEach(o => expect(o.disconnect).toHaveBeenCalledTimes(1))
    ;(globalThis as any).MutationObserver = originalMutationObserver
  })

  it('withSpatialMonitor caches wrapper component', () => {
    const A = withSpatialMonitor('div')
    const B = withSpatialMonitor('div')
    expect(A).toBe(B)
    expect((A as any).displayName).toContain('WithSpatialMonitor')
  })
})

describe('StandardSpatializedContainer', () => {
  it('applies default style and reacts to transform visibility updates', () => {
    let handler: ((v: any) => void) | undefined
    const spatializedContainerObject = {
      onSpatialTransformVisibilityChange: vi.fn((id: string, fn: any) => {
        handler = fn
        fn({ transform: 'none', visibility: 'visible' })
      }),
      offSpatialTransformVisibilityChange: vi.fn(),
    } as any

    const props: any = {
      component: 'div',
      className: 'c',
      inStandardSpatializedContainer: true,
      [SpatialID]: 's1',
    }

    const r = render(
      React.createElement(
        SpatializedContainerContext.Provider,
        { value: spatializedContainerObject },
        React.createElement(StandardSpatializedContainer, props),
      ),
    )

    const el = r.container.querySelector('div') as HTMLDivElement
    expect(el).toBeTruthy()
    expect(el.className).toContain('xr-spatial-default')
    expect(el.className).toContain('c')
    expect(el.style.visibility).toBe('hidden')
    expect(el.style.transition).toBe('none')
    expect(el.style.transform).toBe('none')

    act(() => {
      handler?.({ transform: [], visibility: 'visible' })
    })
    expect(el.style.transform).toContain('translateZ')

    r.unmount()
  })

  it('injectSpatialDefaultStyle adds style tag into head', () => {
    const before = document.head.querySelectorAll('style').length
    injectSpatialDefaultStyle()
    const after = document.head.querySelectorAll('style').length
    expect(after).toBe(before + 1)
    const last = document.head.querySelectorAll('style')[after - 1]
    expect(last?.innerHTML).toContain('xr-spatial-default')
  })
})

describe('Spatialized2DElementContainerFactory', () => {
  it('withSpatialized2DElementContainer caches per component', async () => {
    vi.doMock('@webspatial/core-sdk', () => {
      return {
        Spatialized2DElement: class Spatialized2DElement {},
        SpatializedStatic3DElement: class SpatializedStatic3DElement {},
        isSSREnv: () => false,
      }
    })

    const { withSpatialized2DElementContainer } = await import(
      './spatialized-container/Spatialized2DElementContainerFactory'
    )

    const A = withSpatialized2DElementContainer('div')
    const B = withSpatialized2DElementContainer('div')
    expect(A).toBe(B)
  })
})

describe('spatialized-container/hooks/useSpatialEvents', () => {
  it('useSpatialEventsBase proxies currentTarget and isTrusted', () => {
    const currentTarget = { tag: 'real' } as any
    const onSpatialTap = vi.fn((e: any) => {
      expect(e.currentTarget).toBe(currentTarget)
      expect(e.isTrusted).toBe(true)
      expect(e.type).toBe('tap')
    })

    const events = useSpatialEventsBase(
      { onSpatialTap } as any,
      () => currentTarget,
    )

    events.onSpatialTap?.({
      type: 'tap',
      currentTarget: { tag: 'fake' },
    } as any)
    expect(onSpatialTap).toHaveBeenCalledTimes(1)
  })

  it('useSpatialEventsWhenSpatializedContainerExist resolves target from container', () => {
    const currentTarget = { tag: 'from-container' } as any
    const spatializedContainerObject = {
      getSpatialContainerRefProxyBySpatialId: vi.fn().mockReturnValue({
        domProxy: currentTarget,
      }),
    } as any

    const onSpatialDrag = vi.fn((e: any) => {
      expect(e.currentTarget).toBe(currentTarget)
      expect(e.isTrusted).toBe(true)
      expect(e.type).toBe('drag')
    })

    const events = useSpatialEventsWhenSpatializedContainerExist(
      { onSpatialDrag } as any,
      'sid',
      spatializedContainerObject,
    )

    events.onSpatialDrag?.({
      type: 'drag',
      currentTarget: { tag: 'fake' },
    } as any)

    expect(
      spatializedContainerObject.getSpatialContainerRefProxyBySpatialId,
    ).toHaveBeenCalledWith('sid')
    expect(onSpatialDrag).toHaveBeenCalledTimes(1)
  })
})

describe('TransformVisibilityTaskContainer', () => {
  it('creates css parser container and portals hidden div', () => {
    const originalMutationObserver = (globalThis as any).MutationObserver
    ;(globalThis as any).MutationObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(public callback: (mutations: any[]) => void) {}
    }

    initCSSParserDivContainer()

    const updateSpatialTransformVisibility = vi.fn()
    const spatializedContainerObject = {
      updateSpatialTransformVisibility,
    } as any

    const r = render(
      React.createElement(
        SpatializedContainerContext.Provider,
        { value: spatializedContainerObject },
        React.createElement(TransformVisibilityTaskContainer, {
          [SpatialID]: 'tv1',
          className: 'c',
          style: { left: 1, opacity: 1 },
        } as any),
      ),
    )

    const host = document.querySelector(
      'div[data-id="css-parser-div-container"]',
    ) as HTMLDivElement
    expect(host).toBeTruthy()

    const div = host.querySelector('div') as HTMLDivElement
    expect(div).toBeTruthy()
    expect(div.getAttribute(SpatialID)).toBe('tv1')
    expect(div.className).toBe('c')
    expect(div.style.left).toBe('-10000px')
    expect(div.style.top).toBe('-10000px')
    expect(div.style.opacity).toBe('0')
    expect(div.style.pointerEvents).toBe('none')

    r.unmount()
    host.remove()
    ;(globalThis as any).MutationObserver = originalMutationObserver
  })
})

describe('spatialized-container/hooks/useSpatializedElement', () => {
  it('attaches element on resolve and destroys on cleanup', async () => {
    vi.resetModules()
    vi.doMock('@webspatial/core-sdk', () => {
      return { SpatializedElement: class SpatializedElement {} }
    })

    const { useSpatializedElement } = await import(
      './spatialized-container/hooks/useSpatializedElement'
    )

    const attachSpatializedElement = vi.fn()
    const portalInstanceObject = { attachSpatializedElement } as any

    const element = { destroy: vi.fn() } as any
    const createSpatializedElement = vi.fn().mockResolvedValue(element)

    function Test() {
      const e = useSpatializedElement(
        createSpatializedElement,
        portalInstanceObject,
      )
      return React.createElement('div', { 'data-ready': String(!!e) })
    }

    const r = render(React.createElement(Test))
    await act(async () => {
      await Promise.resolve()
    })

    expect(createSpatializedElement).toHaveBeenCalledTimes(1)
    expect(attachSpatializedElement).toHaveBeenCalledWith(element)
    expect(r.container.querySelector('div')?.getAttribute('data-ready')).toBe(
      'true',
    )

    r.unmount()
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })

  it('destroys element if resolved after unmount', async () => {
    vi.resetModules()
    vi.doMock('@webspatial/core-sdk', () => {
      return { SpatializedElement: class SpatializedElement {} }
    })

    const { useSpatializedElement } = await import(
      './spatialized-container/hooks/useSpatializedElement'
    )

    const attachSpatializedElement = vi.fn()
    const portalInstanceObject = { attachSpatializedElement } as any

    let resolve: ((v: any) => void) | undefined
    const element = { destroy: vi.fn() } as any
    const createSpatializedElement = vi.fn().mockImplementation(
      () =>
        new Promise(r => {
          resolve = r
        }),
    )

    function Test() {
      useSpatializedElement(createSpatializedElement, portalInstanceObject)
      return null
    }

    const r = render(React.createElement(Test))
    r.unmount()

    await act(async () => {
      resolve?.(element)
      await Promise.resolve()
    })

    expect(attachSpatializedElement).not.toHaveBeenCalled()
    expect(element.destroy).toHaveBeenCalledTimes(1)
  })
})

describe('PortalSpatializedContainer', () => {
  it('renders content, placeholder, and assigns event handlers', async () => {
    vi.resetModules()

    const initCalls: any[] = []
    const destroyCalls: any[] = []

    vi.doMock('./spatialized-container/context/PortalInstanceContext', () => {
      const PortalInstanceContext = React.createContext<any>(null)
      class PortalInstanceObject {
        spatialId: string
        parentPortalInstanceObject: any
        domRect: any
        computedStyle: any
        dom: HTMLElement | null
        attachSpatializedElement = vi.fn()
        init = vi.fn(() => initCalls.push(this.spatialId))
        destroy = vi.fn(() => destroyCalls.push(this.spatialId))
        constructor(
          spatialId: string,
          _obj: any,
          parentPortalInstanceObject: any,
          _extra: any,
        ) {
          this.spatialId = spatialId
          this.parentPortalInstanceObject = parentPortalInstanceObject
          this.domRect = { width: 10, height: 20 }
          this.computedStyle = {
            getPropertyValue: () => 'relative',
            getPropertyPriority: () => 'block',
          }
          this.dom = document.createElement('div')
        }
      }
      return { PortalInstanceContext, PortalInstanceObject }
    })

    const spatializedElement: any = {}
    vi.doMock('./spatialized-container/hooks/useSpatializedElement', () => {
      return { useSpatializedElement: () => spatializedElement }
    })
    vi.doMock('./spatialized-container/hooks/useSync2DFrame', () => {
      return { useSync2DFrame: vi.fn() }
    })

    const { PortalInstanceContext } = await import(
      './spatialized-container/context/PortalInstanceContext'
    )
    const { PortalSpatializedContainer } = await import(
      './spatialized-container/PortalSpatializedContainer'
    )

    function Content(props: any) {
      return React.createElement('div', {
        'data-testid': 'content',
        'data-has': String(!!props.spatializedElement),
      })
    }

    const onSpatialTap = vi.fn()
    const onSpatialDrag = vi.fn()
    const onSpatialDragEnd = vi.fn()
    const onSpatialRotate = vi.fn()
    const onSpatialRotateEnd = vi.fn()
    const onSpatialMagnify = vi.fn()
    const onSpatialMagnifyEnd = vi.fn()
    const onSpatialDragStart = vi.fn()

    const r = render(
      React.createElement(
        SpatializedContainerContext.Provider,
        { value: {} as any },
        React.createElement(
          PortalInstanceContext.Provider,
          { value: { parent: true } as any },
          React.createElement(PortalSpatializedContainer, {
            component: 'div',
            spatializedContent: Content,
            createSpatializedElement: async () => spatializedElement,
            getExtraSpatializedElementProperties: () => ({}),
            [SpatialID]: 'p1',
            onSpatialTap,
            onSpatialDragStart,
            onSpatialDrag,
            onSpatialDragEnd,
            onSpatialRotate,
            onSpatialRotateEnd,
            onSpatialMagnify,
            onSpatialMagnifyEnd,
          } as any),
        ),
      ),
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(
      r.container
        .querySelector('[data-testid="content"]')
        ?.getAttribute('data-has'),
    ).toBe('true')
    const placeholder = r.container.querySelector(
      `div[${SpatialID}="p1"]`,
    ) as HTMLDivElement
    expect(placeholder).toBeTruthy()
    expect(placeholder.style.width).toBe('10px')
    expect(placeholder.style.height).toBe('20px')
    expect(placeholder.style.visibility).toBe('hidden')
    expect(placeholder.style.display).toBe('block')

    expect(spatializedElement.onSpatialTap).toBe(onSpatialTap)
    expect(spatializedElement.onSpatialDragStart).toBe(onSpatialDragStart)
    expect(spatializedElement.onSpatialDrag).toBe(onSpatialDrag)
    expect(spatializedElement.onSpatialDragEnd).toBe(onSpatialDragEnd)
    expect(spatializedElement.onSpatialRotate).toBe(onSpatialRotate)
    expect(spatializedElement.onSpatialRotateEnd).toBe(onSpatialRotateEnd)
    expect(spatializedElement.onSpatialMagnify).toBe(onSpatialMagnify)
    expect(spatializedElement.onSpatialMagnifyEnd).toBe(onSpatialMagnifyEnd)

    r.unmount()
    expect(initCalls).toEqual(['p1'])
    expect(destroyCalls).toEqual(['p1'])
  })
})

describe('SpatializedContainer', () => {
  it('renders plain component when not in WebSpatial env', async () => {
    vi.resetModules()
    vi.doMock('./spatialized-container/context/PortalInstanceContext', () => {
      return {
        PortalInstanceContext: React.createContext(null),
        PortalInstanceObject: class PortalInstanceObject {},
      }
    })
    vi.doMock('./utils/getSession', () => {
      return { getSession: () => null }
    })

    const { SpatializedContainer } = await import(
      './spatialized-container/SpatializedContainer'
    )

    const r = render(
      React.createElement(SpatializedContainer, {
        component: 'div',
        'data-testid': 'plain',
      } as any),
    )
    expect(r.container.querySelector('[data-testid="plain"]')).toBeTruthy()
  })

  it('renders root container with standard/portal/task containers', async () => {
    vi.resetModules()
    vi.doMock('./spatialized-container/context/PortalInstanceContext', () => {
      return {
        PortalInstanceContext: React.createContext(null),
        PortalInstanceObject: class PortalInstanceObject {},
      }
    })
    vi.doMock('./utils/getSession', () => {
      return { getSession: () => ({}) }
    })
    vi.doMock('./spatialized-container/hooks/useDomProxy', () => {
      return {
        useDomProxy: () => {
          const spatialContainerRefProxy = {
            current: { domProxy: { tag: 't' } },
          }
          return {
            transformVisibilityTaskContainerCallback: vi.fn(),
            standardSpatializedContainerCallback: vi.fn(),
            spatialContainerRefProxy,
          }
        },
      }
    })
    vi.doMock('./spatialized-container/hooks/useSpatialEvents', () => {
      return {
        useSpatialEvents: () => ({ onSpatialTap: vi.fn() }),
        useSpatialEventsWhenSpatializedContainerExist: () => ({
          onSpatialTap: vi.fn(),
        }),
      }
    })
    vi.doMock('./spatialized-container/StandardSpatializedContainer', () => {
      return {
        StandardSpatializedContainer: React.forwardRef((p: any, ref: any) =>
          React.createElement('div', {
            ref,
            'data-testid': 'standard',
            'data-sid': p[SpatialID],
            'data-in': String(p.inStandardSpatializedContainer),
          }),
        ),
      }
    })
    vi.doMock('./spatialized-container/PortalSpatializedContainer', () => {
      return {
        PortalSpatializedContainer: (p: any) =>
          React.createElement('div', {
            'data-testid': 'portal',
            'data-sid': p[SpatialID],
            'data-hastap': String(!!p.onSpatialTap),
          }),
      }
    })
    vi.doMock(
      './spatialized-container/TransformVisibilityTaskContainer',
      () => {
        return {
          TransformVisibilityTaskContainer: React.forwardRef(
            (p: any, ref: any) =>
              React.createElement('div', {
                ref,
                'data-testid': 'tv',
                'data-sid': p[SpatialID],
              }),
          ),
        }
      },
    )

    const { SpatializedContainer } = await import(
      './spatialized-container/SpatializedContainer'
    )

    const r = render(
      React.createElement(SpatializedContainer, {
        component: 'div',
        className: 'c',
        style: {},
        spatializedContent: () => null,
        createSpatializedElement: async () => ({}),
        getExtraSpatializedElementProperties: () => ({}),
      } as any),
    )

    expect(
      r.container
        .querySelector('[data-testid="standard"]')
        ?.getAttribute('data-in'),
    ).toBe('false')
    expect(
      r.container
        .querySelector('[data-testid="portal"]')
        ?.getAttribute('data-hastap'),
    ).toBe('true')
    expect(r.container.querySelector('[data-testid="tv"]')).toBeTruthy()
  })

  it('renders nested portal container when inside portal instance env', async () => {
    vi.resetModules()
    vi.doMock('./spatialized-container/context/PortalInstanceContext', () => {
      return {
        PortalInstanceContext: React.createContext(null),
        PortalInstanceObject: class PortalInstanceObject {},
      }
    })
    vi.doMock('./utils/getSession', () => {
      return { getSession: () => ({}) }
    })
    vi.doMock('./spatialized-container/hooks/useSpatialEvents', () => {
      return {
        useSpatialEvents: () => ({}),
        useSpatialEventsWhenSpatializedContainerExist: () => ({
          onSpatialTap: vi.fn(),
        }),
      }
    })
    vi.doMock('./spatialized-container/PortalSpatializedContainer', () => {
      return {
        PortalSpatializedContainer: (p: any) =>
          React.createElement('div', {
            'data-testid': 'portal-only',
            'data-sid': p[SpatialID],
          }),
      }
    })

    const { SpatializedContainerContext } = await import(
      './spatialized-container/context/SpatializedContainerContext'
    )
    const { PortalInstanceContext } = await import(
      './spatialized-container/context/PortalInstanceContext'
    )
    const { SpatializedContainer } = await import(
      './spatialized-container/SpatializedContainer'
    )

    const rootSpatializedContainerObject = {
      getSpatialId: () => 'nested1',
    } as any

    const r = render(
      React.createElement(
        SpatializedContainerContext.Provider,
        { value: rootSpatializedContainerObject },
        React.createElement(
          PortalInstanceContext.Provider,
          { value: { any: true } as any },
          React.createElement(SpatializedContainer, {
            component: 'div',
            spatializedContent: () => null,
            createSpatializedElement: async () => ({}),
            getExtraSpatializedElementProperties: () => ({}),
          } as any),
        ),
      ),
    )

    expect(
      r.container
        .querySelector('[data-testid="portal-only"]')
        ?.getAttribute('data-sid'),
    ).toBe('nested1')
  })
})

describe('utils/getSession', () => {
  it('returns null in SSR env', async () => {
    vi.resetModules()
    vi.doUnmock('./utils/getSession')
    vi.doMock('@webspatial/core-sdk', () => {
      return {
        isSSREnv: () => true,
        Spatial: class {},
      }
    })

    const { getSession } = await import('./utils/getSession')
    expect(getSession()).toBe(null)
  })

  it('caches Spatial instance and session when supported', async () => {
    vi.resetModules()
    vi.doUnmock('./utils/getSession')

    const session = { ok: true }
    const Spatial = vi.fn().mockImplementation(() => {
      return {
        isSupported: () => true,
        requestSession: vi.fn(() => session),
      }
    })

    vi.doMock('@webspatial/core-sdk', () => {
      return {
        isSSREnv: () => false,
        Spatial,
      }
    })

    const mod = await import('./utils/getSession')
    const s1 = mod.getSession()
    const s2 = mod.getSession()
    expect(s1).toBe(session)
    expect(s2).toBe(session)
    expect(Spatial).toHaveBeenCalledTimes(1)
    expect(mod.spatial).not.toBe(null)
  })

  it('returns null when not supported', async () => {
    vi.resetModules()
    vi.doUnmock('./utils/getSession')

    const Spatial = vi.fn().mockImplementation(() => {
      return {
        isSupported: () => false,
        requestSession: vi.fn(),
      }
    })

    vi.doMock('@webspatial/core-sdk', () => {
      return {
        isSSREnv: () => false,
        Spatial,
      }
    })

    const { getSession } = await import('./utils/getSession')
    expect(getSession()).toBe(null)
    expect(Spatial).toHaveBeenCalledTimes(1)
  })
})

describe('utils/debugTool', () => {
  it('enableDebugTool exposes helpers on window when not SSR', async () => {
    vi.resetModules()

    const inspect = vi.fn().mockResolvedValue({ a: 1 })
    vi.doMock('./utils/getSession', () => {
      return {
        getSession: () => ({
          getSpatialScene: () => ({ inspect }),
        }),
      }
    })
    vi.doMock('@webspatial/core-sdk', () => {
      return {
        isSSREnv: () => false,
      }
    })

    const { enableDebugTool } = await import('./utils/debugTool')
    enableDebugTool()

    expect(typeof (window as any).inspectCurrentSpatialScene).toBe('function')
    expect(typeof (window as any).getSpatialized2DElement).toBe('function')
    await expect((window as any).inspectCurrentSpatialScene()).resolves.toEqual(
      {
        a: 1,
      },
    )

    const el = document.createElement('div')
    ;(el as any).__innerSpatializedElement = () => ({ id: 'w1' })
    expect((window as any).getSpatialized2DElement(el)).toEqual({ id: 'w1' })
  })

  it('enableDebugTool is no-op in SSR env', async () => {
    vi.resetModules()
    delete (window as any).inspectCurrentSpatialScene
    delete (window as any).getSpatialized2DElement

    vi.doMock('@webspatial/core-sdk', () => {
      return {
        isSSREnv: () => true,
      }
    })
    const { enableDebugTool } = await import('./utils/debugTool')
    enableDebugTool()
    expect((window as any).inspectCurrentSpatialScene).toBeUndefined()
    expect((window as any).getSpatialized2DElement).toBeUndefined()
  })
})

describe('Spatialized2DElementContainer', () => {
  it('creates 2D element, syncs head/title, and portals content', async () => {
    vi.resetModules()
    vi.useFakeTimers()

    const originalMutationObserver = (globalThis as any).MutationObserver
    const observers: any[] = []
    ;(globalThis as any).MutationObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor(public callback: () => void) {
        observers.push(this)
      }
    }

    const parentLink = document.createElement('link')
    parentLink.rel = 'stylesheet'
    parentLink.href = 'https://example.com/a.css'
    document.head.appendChild(parentLink)
    document.documentElement.className = 'root'
    document.documentElement.style.setProperty(
      '--xr-background-material',
      'translucent',
    )

    const childDoc = document.implementation.createHTMLDocument('child')
    const originalAppend = childDoc.head.appendChild.bind(childDoc.head)
    ;(childDoc.head as any).appendChild = (node: any) => {
      const r = originalAppend(node)
      if (typeof node.onload === 'function') {
        node.onload()
      }
      return r
    }

    const updateProperties = vi.fn()
    const createSpatialized2DElement = vi.fn().mockResolvedValue({
      windowProxy: { document: childDoc } as any,
      updateProperties,
    })

    vi.doMock('./utils', () => {
      return {
        getSession: () => ({ createSpatialized2DElement }),
        enableDebugTool: vi.fn(),
      }
    })

    vi.doMock('./spatialized-container/SpatializedContainer', () => {
      const React = require('react')
      function MockSpatializedContainer(props: any) {
        const [el, setEl] = React.useState(null as any)
        const extraProps = props.getExtraSpatializedElementProperties({
          getPropertyValue: (p: string) => {
            if (p === 'width') return '200px'
            if (p === 'overflow') return 'hidden'
            if (p === '--xr-background-material') return 'translucent'
            if (p === 'border-top-left-radius') return '10px'
            if (p === 'border-top-right-radius') return '5%'
            if (p === 'border-bottom-left-radius') return ''
            if (p === 'border-bottom-right-radius') return ''
            return ''
          },
        } as any)

        React.useEffect(() => {
          Promise.resolve(props.createSpatializedElement()).then(setEl)
        }, [])

        return React.createElement(
          'div',
          {
            'data-scroll': String(extraProps.scrollPageEnabled),
            'data-material': String(extraProps.material),
            'data-cr': String(extraProps.cornerRadius.topLeading),
          },
          el
            ? React.createElement(props.spatializedContent, {
                component: 'div',
                style: {},
                'data-name': 'hello',
                spatializedElement: el,
              })
            : null,
        )
      }
      return { SpatializedContainer: MockSpatializedContainer }
    })

    const { PortalInstanceContext } = await import(
      './spatialized-container/context/PortalInstanceContext'
    )
    const portalInstanceObject = {
      computedStyle: {
        getPropertyValue: vi.fn(() => ''),
      },
    } as any

    const { Spatialized2DElementContainer } = await import(
      './spatialized-container/Spatialized2DElementContainer'
    )

    const r = render(
      React.createElement(
        PortalInstanceContext.Provider,
        { value: portalInstanceObject },
        React.createElement(Spatialized2DElementContainer as any, {
          component: 'div',
          'data-testid': 'host',
        }),
      ),
    )

    await act(async () => {
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(60)
      await Promise.resolve()
    })

    expect(
      r.container.querySelector('[data-scroll]')?.getAttribute('data-cr'),
    ).toBe('10')
    expect(
      r.container.querySelector('[data-scroll]')?.getAttribute('data-scroll'),
    ).toBe('true')
    expect(
      r.container.querySelector('[data-scroll]')?.getAttribute('data-material'),
    ).toBe('translucent')

    expect(updateProperties).toHaveBeenCalledWith({ name: 'hello' })
    expect(childDoc.title).toBe('hello')
    expect(childDoc.head.querySelector('meta[name="viewport"]')).toBeTruthy()
    expect(childDoc.head.querySelector('link[rel="stylesheet"]')).toBeTruthy()
    expect(childDoc.documentElement.className).toBe('root')

    act(() => {
      observers.forEach(o => o.callback())
    })

    r.unmount()
    observers.forEach(o => expect(o.disconnect).toHaveBeenCalledTimes(1))
    parentLink.remove()
    ;(globalThis as any).MutationObserver = originalMutationObserver
    vi.useRealTimers()
  })
})

describe('SpatializedStatic3DElementContainer', () => {
  it('syncs modelURL and wires load callbacks and extra ref props', async () => {
    vi.resetModules()

    const updateProperties = vi.fn()
    const updateModelTransform = vi.fn()
    const spatializedStatic3DElement: any = {
      updateProperties,
      updateModelTransform,
      ready: Promise.resolve(true),
      onLoadCallback: undefined,
      onLoadFailureCallback: undefined,
    }

    const createSpatializedStatic3DElement = vi
      .fn()
      .mockResolvedValue(spatializedStatic3DElement)

    vi.doMock('./utils', () => {
      return {
        getSession: () => ({ createSpatializedStatic3DElement }),
        enableDebugTool: vi.fn(),
      }
    })

    const originalRAF = (globalThis as any).requestAnimationFrame
    ;(globalThis as any).requestAnimationFrame = (cb: any) => {
      cb()
      return 0
    }

    let extra: any
    let domProxy: any
    vi.doMock('./spatialized-container/SpatializedContainer', () => {
      const React = require('react')
      function MockSpatializedContainer(props: any) {
        const [el, setEl] = React.useState(null as any)
        React.useEffect(() => {
          Promise.resolve(props.createSpatializedElement()).then(setEl)
        }, [])
        const content = el
          ? React.createElement(props.spatializedContent, {
              src: props.src,
              spatializedElement: el,
              onLoad: props.onLoad,
              onError: props.onError,
            })
          : null
        if (el) {
          domProxy = { __spatializedElement: el }
          extra = props.extraRefProps(domProxy)
        }
        return React.createElement('div', { 'data-testid': 'host' }, content)
      }
      return { SpatializedContainer: MockSpatializedContainer }
    })

    const { PortalInstanceContext } = await import(
      './spatialized-container/context/PortalInstanceContext'
    )
    const onLoad = vi.fn()
    const onError = vi.fn()
    const portalInstanceObject = {
      dom: { __targetProxy: { tid: 1 } },
    } as any

    const { SpatializedStatic3DElementContainer } = await import(
      './spatialized-container/SpatializedStatic3DElementContainer'
    )

    render(
      React.createElement(
        PortalInstanceContext.Provider,
        { value: portalInstanceObject },
        React.createElement(SpatializedStatic3DElementContainer as any, {
          src: '/m.glb',
          onLoad,
          onError,
        }),
      ),
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(updateProperties).toHaveBeenCalledWith({
      modelURL: window.location.origin + '/m.glb',
    })

    spatializedStatic3DElement.onLoadCallback?.()
    spatializedStatic3DElement.onLoadFailureCallback?.()
    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onLoad.mock.calls[0]?.[0].type).toBe('modelloaded')
    expect(onError.mock.calls[0]?.[0].type).toBe('modelloadfailed')
    expect(onLoad.mock.calls[0]?.[0].target).toEqual({ tid: 1 })

    expect(extra.currentSrc).toBe(window.location.origin + '/m.glb')
    await expect(extra.ready).resolves.toMatchObject({ type: 'modelloaded' })

    const m = extra.entityTransform
    ;(m as any).m11 = 2
    extra.entityTransform = m
    expect(updateModelTransform).toHaveBeenCalledTimes(1)
    expect(updateModelTransform).toHaveBeenCalledWith(expect.any(DOMMatrix))
    expect((domProxy as any).entityTransform).toBeUndefined()
    ;(globalThis as any).requestAnimationFrame = originalRAF
  })

  it('extra ready rejects with failure event when model ready fails', async () => {
    vi.resetModules()

    const spatializedStatic3DElement: any = {
      updateProperties: vi.fn(),
      updateModelTransform: vi.fn(),
      ready: Promise.resolve(false),
    }
    const createSpatializedStatic3DElement = vi
      .fn()
      .mockResolvedValue(spatializedStatic3DElement)

    vi.doMock('./utils', () => {
      return {
        getSession: () => ({ createSpatializedStatic3DElement }),
        enableDebugTool: vi.fn(),
      }
    })

    let extra: any
    vi.doMock('./spatialized-container/SpatializedContainer', () => {
      const React = require('react')
      function MockSpatializedContainer(props: any) {
        const [el, setEl] = React.useState(null as any)
        React.useEffect(() => {
          Promise.resolve(props.createSpatializedElement()).then(setEl)
        }, [])
        if (el) {
          extra = props.extraRefProps({ __spatializedElement: el })
        }
        return React.createElement('div')
      }
      return { SpatializedContainer: MockSpatializedContainer }
    })

    const { PortalInstanceContext } = await import(
      './spatialized-container/context/PortalInstanceContext'
    )
    const { SpatializedStatic3DElementContainer } = await import(
      './spatialized-container/SpatializedStatic3DElementContainer'
    )

    render(
      React.createElement(
        PortalInstanceContext.Provider,
        { value: { dom: { __targetProxy: {} } } as any },
        React.createElement(SpatializedStatic3DElementContainer as any, {
          src: '/m2.glb',
        }),
      ),
    )

    await act(async () => {
      await Promise.resolve()
    })

    await expect(extra.ready).rejects.toMatchObject({
      type: 'modelloadfailed',
    })
  })
})
