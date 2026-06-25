import { beforeEach, describe, expect, it, vi } from 'vitest'

class DOMMatrixPolyfill {
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

describe('PortalInstanceObject motion sync', () => {
  let PortalInstanceObject: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./PortalInstanceContext')
    PortalInstanceObject = mod.PortalInstanceObject
  })

  function createPortalWithElement() {
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

    const computedStyle = makeComputedStyle({
      position: 'fixed',
      opacity: '0.7',
      display: 'block',
      '--xr-z-index': '3',
      '--xr-back': '1',
      '--xr-depth': '2',
      'transform-origin': '0 0',
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(computedStyle)

    const spatializedElement = {
      id: 'el-1',
      cubeInfo: undefined,
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
    spatializedElement.updateProperties.mockClear()
    spatializedElement.updateTransform.mockClear()

    return { portal, spatializedElement }
  }

  it('always syncs opacity and layout properties to native', () => {
    const { portal, spatializedElement } = createPortalWithElement()

    portal.notify2DFrameChange()

    expect(spatializedElement.updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 100,
        height: 50,
        depth: 2,
        backOffset: 1,
        opacity: 0.7,
      }),
    )
  })

  it('always forwards the latest transform matrix to updateTransform', () => {
    const { portal, spatializedElement } = createPortalWithElement()

    portal.notify2DFrameChange()

    expect(spatializedElement.updateTransform).toHaveBeenCalledTimes(1)
    expect(spatializedElement.updateTransform).toHaveBeenCalledWith(
      expect.any(DOMMatrixPolyfill),
    )
  })

  it('falls back to opacity 1 when computed opacity is not numeric', () => {
    const { portal, spatializedElement } = createPortalWithElement()
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(
      makeComputedStyle({
        position: 'fixed',
        opacity: '',
        display: 'block',
        '--xr-z-index': '3',
        '--xr-back': '1',
        '--xr-depth': '2',
        'transform-origin': '0 0',
      }),
    )

    portal.notify2DFrameChange()

    expect(spatializedElement.updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        opacity: 1,
      }),
    )
  })
})
