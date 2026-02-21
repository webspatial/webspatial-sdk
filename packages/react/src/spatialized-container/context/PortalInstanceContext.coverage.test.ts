import { describe, expect, it, vi } from 'vitest'

class DOMMatrixPolyfill {
  translate(x = 0, y = 0) {
    ;(this as any)._tx = ((this as any)._tx ?? 0) + x
    ;(this as any)._ty = ((this as any)._ty ?? 0) + y
    return this
  }

  transformPoint(p: { x: number; y: number }) {
    return {
      x: p.x + ((this as any)._tx ?? 0),
      y: p.y + ((this as any)._ty ?? 0),
      z: 0,
    }
  }

  inverse() {
    return new DOMMatrixPolyfill()
  }

  toFloat64Array() {
    return new Float64Array(16)
  }
}

class DOMPointPolyfill {
  constructor(
    public x: number,
    public y: number,
    public z: number = 0,
  ) {}

  matrixTransform() {
    return new DOMPointPolyfill(this.x, this.y, this.z)
  }
}

;(globalThis as any).DOMMatrix = DOMMatrixPolyfill
;(globalThis as any).DOMPoint = DOMPointPolyfill

const addSpatializedElement = vi.fn().mockResolvedValue(undefined)
const getSpatialScene = vi.fn().mockResolvedValue({ addSpatializedElement })
const getSessionMock = vi.fn(() => ({ getSpatialScene }))

vi.mock('../../utils', () => ({
  getSession: () => getSessionMock(),
}))

function makeComputedStyle(map: Record<string, string>) {
  return {
    getPropertyValue: (key: string) => map[key] ?? '',
  } as any as CSSStyleDeclaration
}

describe('PortalInstanceObject', () => {
  it('updates spatialized element props from dom and transform/visibility', async () => {
    const { PortalInstanceObject } = await import('./PortalInstanceContext')
    const computedStyle = makeComputedStyle({
      position: 'fixed',
      opacity: '0.5',
      display: 'block',
      '--xr-z-index': '5',
      '--xr-back': '1',
      '--xr-depth': '2',
      'transform-origin': '20 10',
      width: '100',
      height: '50',
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(computedStyle)

    const callbacks: Record<string, any> = {}
    const containerObject = {
      onSpatialTransformVisibilityChange: vi.fn((id: string, cb: any) => {
        callbacks[id] = cb
      }),
      offSpatialTransformVisibilityChange: vi.fn(),
      querySpatialDomBySpatialId: vi.fn(),
      queryParentSpatialDomBySpatialId: vi.fn(),
    } as any

    const dom = document.createElement('div')
    dom.getBoundingClientRect = () => new DOMRect(10, 20, 100, 50)
    containerObject.querySpatialDomBySpatialId.mockReturnValue(dom)

    const spatializedElement = {
      cubeInfo: undefined,
      transform: new DOMMatrixPolyfill(),
      transformInv: new DOMMatrixPolyfill(),
      updateProperties: vi.fn(),
      updateTransform: vi.fn(),
    } as any

    const portal = new PortalInstanceObject('sid', containerObject, null)
    portal.init()
    portal.attachSpatializedElement(spatializedElement)

    callbacks.sid({
      transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      visibility: 'visible',
    })

    portal.notify2DFrameChange()

    expect(spatializedElement.updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        clientX: 10,
        clientY: 20,
        width: 100,
        height: 50,
        depth: 2,
        opacity: 0.5,
        scrollWithParent: false,
        zIndex: 5,
        visible: true,
        backOffset: 1,
        rotationAnchor: { x: 0.2, y: 0.2, z: 0.5 },
      }),
    )
    expect(spatializedElement.updateTransform).toHaveBeenCalledWith(
      expect.any(DOMMatrixPolyfill),
    )

    expect((dom as any).__spatializedElement).toBe(spatializedElement)
    expect(typeof (dom as any).__getBoundingClientRect).toBe('function')
    expect(typeof (dom as any).__toSceneSpace).toBe('function')
    expect(typeof (dom as any).__toLocalSpace).toBe('function')
    expect(typeof (dom as any).__innerSpatializedElement).toBe('function')
  })

  it('adds fixed or root portal elements to scene', async () => {
    const { PortalInstanceObject } = await import('./PortalInstanceContext')
    const containerObject = {
      onSpatialTransformVisibilityChange: vi.fn(),
      offSpatialTransformVisibilityChange: vi.fn(),
      querySpatialDomBySpatialId: vi.fn(),
      queryParentSpatialDomBySpatialId: vi.fn(),
    } as any

    const portal = new PortalInstanceObject('sid', containerObject, null)
    portal.attachSpatializedElement({ id: 'el' } as any)

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(addSpatializedElement).toHaveBeenCalled()
  })

  it('adds non-fixed portal elements to parent spatialized 2d element', async () => {
    const { PortalInstanceObject } = await import('./PortalInstanceContext')

    const parentContainerObject = {
      onSpatialTransformVisibilityChange: vi.fn(),
      offSpatialTransformVisibilityChange: vi.fn(),
      querySpatialDomBySpatialId: vi.fn(),
      queryParentSpatialDomBySpatialId: vi.fn(),
    } as any
    const parentPortal = new PortalInstanceObject(
      'p',
      parentContainerObject,
      null,
    )
    const parentSpatialized2DElement = { addSpatializedElement: vi.fn() } as any
    parentPortal.attachSpatializedElement(parentSpatialized2DElement)

    const callbacks: Record<string, any> = {}
    const childContainerObject = {
      onSpatialTransformVisibilityChange: vi.fn((id: string, cb: any) => {
        callbacks[id] = cb
      }),
      offSpatialTransformVisibilityChange: vi.fn(),
      querySpatialDomBySpatialId: vi.fn(),
      queryParentSpatialDomBySpatialId: vi.fn(),
    } as any

    const dom = document.createElement('div')
    dom.getBoundingClientRect = () => new DOMRect(10, 20, 100, 50)
    childContainerObject.querySpatialDomBySpatialId.mockReturnValue(dom)

    const computedStyle = makeComputedStyle({
      position: 'absolute',
      opacity: '1',
      display: 'block',
      '--xr-z-index': '0',
      '--xr-back': '0',
      '--xr-depth': '0',
      'transform-origin': '0 0',
      width: '100',
      height: '50',
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(computedStyle)

    const childPortal = new PortalInstanceObject(
      'c',
      childContainerObject,
      parentPortal,
    )
    childPortal.init()
    childPortal.attachSpatializedElement({
      id: 'child',
      updateProperties: vi.fn(),
      updateTransform: vi.fn(),
    } as any)
    callbacks.c({ transform: [], visibility: 'visible' })
    childPortal.notify2DFrameChange()

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(parentSpatialized2DElement.addSpatializedElement).toHaveBeenCalled()
  })

  it('adjusts client coordinates relative to parent dom when available', async () => {
    const { PortalInstanceObject } = await import('./PortalInstanceContext')

    const computedStyle = makeComputedStyle({
      position: 'absolute',
      opacity: '1',
      display: 'block',
      '--xr-z-index': '0',
      '--xr-back': '0',
      '--xr-depth': '0',
      'transform-origin': '0 0',
      width: '100',
      height: '50',
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(computedStyle)

    const callbacks: Record<string, any> = {}
    const containerObject = {
      onSpatialTransformVisibilityChange: vi.fn((id: string, cb: any) => {
        callbacks[id] = cb
      }),
      offSpatialTransformVisibilityChange: vi.fn(),
      querySpatialDomBySpatialId: vi.fn(),
      queryParentSpatialDomBySpatialId: vi.fn(),
    } as any

    const dom = document.createElement('div')
    dom.getBoundingClientRect = () => new DOMRect(10, 20, 100, 50)
    const parentDom = document.createElement('div')
    parentDom.getBoundingClientRect = () => new DOMRect(5, 7, 100, 50)

    containerObject.querySpatialDomBySpatialId.mockReturnValue(dom)
    containerObject.queryParentSpatialDomBySpatialId.mockReturnValue(parentDom)

    const spatializedElement = {
      updateProperties: vi.fn(),
      updateTransform: vi.fn(),
    } as any

    const portal = new PortalInstanceObject('sid', containerObject, null)
    portal.init()
    portal.attachSpatializedElement(spatializedElement)
    callbacks.sid({ transform: [], visibility: 'visible' })
    portal.notify2DFrameChange()

    expect(spatializedElement.updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        clientX: 5,
        clientY: 13,
      }),
    )
  })
})
