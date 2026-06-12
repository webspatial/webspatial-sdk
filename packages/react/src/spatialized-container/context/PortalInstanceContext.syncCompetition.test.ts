import { describe, expect, it, vi, beforeEach } from 'vitest'

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

describe('Sync Competition Tests (Task 5.4)', () => {
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
      width: '100',
      height: '50',
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(computedStyle)

    const spatializedElement = {
      id: 'el-1',
      cubeInfo: undefined,
      transform: new DOMMatrixPolyfill(),
      transformInv: new DOMMatrixPolyfill(),
      updateProperties: vi.fn(),
      updateTransform: vi.fn(),
    } as any

    const portal = new PortalInstanceObject('sid', containerObject, null)
    portal.init()
    portal.attachSpatializedElement(spatializedElement)

    // Trigger transform/visibility
    callbacks.sid({
      transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      visibility: 'visible',
    })

    // Trigger initial DOM sync to populate cachedDomInfo
    portal.notify2DFrameChange()
    spatializedElement.updateProperties.mockClear()
    spatializedElement.updateTransform.mockClear()

    return { portal, spatializedElement, callbacks, containerObject }
  }

  // ============================================================
  // Opacity property-level suppression
  // ============================================================
  describe('opacity property-level suppression', () => {
    it('suppresses opacity from updateProperties when animation controls it', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      // Set suppression for opacity
      portal.setSuppressedFields(new Set(['opacity']))

      // Trigger a property sync
      portal.notify2DFrameChange()

      // opacity should NOT be in the updateProperties call
      const lastCall =
        spatializedElement.updateProperties.mock.calls[
          spatializedElement.updateProperties.mock.calls.length - 1
        ]
      expect(lastCall[0]).not.toHaveProperty('opacity')
      // Other fields should still be present
      expect(lastCall[0]).toHaveProperty('width')
      expect(lastCall[0]).toHaveProperty('height')
      expect(lastCall[0]).toHaveProperty('depth')
    })

    it('resumes opacity sync after suppression is released', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      // Suppress opacity
      portal.setSuppressedFields(new Set(['opacity']))
      portal.notify2DFrameChange()

      const callsWithSuppression =
        spatializedElement.updateProperties.mock.calls.length

      // Release suppression (passing null)
      portal.setSuppressedFields(null)

      expect(
        spatializedElement.updateProperties.mock.calls.length,
      ).toBeGreaterThan(callsWithSuppression)

      // setSuppressedFields(null) should trigger a forced sync
      const lastCall =
        spatializedElement.updateProperties.mock.calls[
          spatializedElement.updateProperties.mock.calls.length - 1
        ]
      expect(lastCall[0]).toHaveProperty('opacity')
      expect(lastCall[0].opacity).toBe(0.7)
    })

    it('release suppression forces re-sync automatically', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      // Suppress
      portal.setSuppressedFields(new Set(['opacity']))
      const callsBefore = spatializedElement.updateProperties.mock.calls.length

      // Release
      portal.setSuppressedFields(null)

      // Should have called updateProperties more times (forced sync)
      expect(
        spatializedElement.updateProperties.mock.calls.length,
      ).toBeGreaterThan(callsBefore)
    })

    it('uncontrolled fields continue to update during suppression', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      // Only suppress opacity
      portal.setSuppressedFields(new Set(['opacity']))
      portal.notify2DFrameChange()

      const lastCall =
        spatializedElement.updateProperties.mock.calls[
          spatializedElement.updateProperties.mock.calls.length - 1
        ]
      // width/height/depth should still be there
      expect(lastCall[0]).toHaveProperty('width', 100)
      expect(lastCall[0]).toHaveProperty('height', 50)
      expect(lastCall[0]).toHaveProperty('depth', 2)
      expect(lastCall[0]).toHaveProperty('backOffset', 1)
    })
  })

  // ============================================================
  // Transform-wide suppression
  // ============================================================
  describe('transform-wide suppression', () => {
    it('suppresses updateTransform when animation controls transform', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      // Suppress transform
      portal.setSuppressedFields(new Set(['transform']))
      spatializedElement.updateTransform.mockClear()

      portal.notify2DFrameChange()

      // updateTransform should NOT be called
      expect(spatializedElement.updateTransform).not.toHaveBeenCalled()
      // But updateProperties should still be called (for non-transform fields)
      expect(spatializedElement.updateProperties).toHaveBeenCalled()
    })

    it('transform sync resumes after suppression is released', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      // Suppress transform
      portal.setSuppressedFields(new Set(['transform']))
      spatializedElement.updateTransform.mockClear()
      portal.notify2DFrameChange()
      expect(spatializedElement.updateTransform).not.toHaveBeenCalled()

      // Release suppression
      portal.setSuppressedFields(null)

      // The forced sync on release should call updateTransform
      expect(spatializedElement.updateTransform).toHaveBeenCalled()
    })

    it('suppresses both opacity and transform simultaneously', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity', 'transform']))
      spatializedElement.updateProperties.mockClear()
      spatializedElement.updateTransform.mockClear()

      portal.notify2DFrameChange()

      // opacity suppressed
      const propsCall =
        spatializedElement.updateProperties.mock.calls[
          spatializedElement.updateProperties.mock.calls.length - 1
        ]
      expect(propsCall[0]).not.toHaveProperty('opacity')

      // transform suppressed
      expect(spatializedElement.updateTransform).not.toHaveBeenCalled()

      // Other fields still present
      expect(propsCall[0]).toHaveProperty('width')
      expect(propsCall[0]).toHaveProperty('height')
    })
  })

  // ============================================================
  // Suppression release timing
  // ============================================================
  describe('suppression release timing', () => {
    it('releasing suppression with empty set acts same as null', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity']))
      const callsBefore = spatializedElement.updateProperties.mock.calls.length

      // Release via empty set
      portal.setSuppressedFields(new Set())

      // Should trigger forced sync
      expect(
        spatializedElement.updateProperties.mock.calls.length,
      ).toBeGreaterThan(callsBefore)
      const lastCall =
        spatializedElement.updateProperties.mock.calls[
          spatializedElement.updateProperties.mock.calls.length - 1
        ]
      expect(lastCall[0]).toHaveProperty('opacity')
    })

    it('setting suppression to same fields does NOT force sync', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity']))
      const callsAfterFirst =
        spatializedElement.updateProperties.mock.calls.length

      // Set same suppression again
      portal.setSuppressedFields(new Set(['opacity']))

      // Should NOT trigger a new sync (still suppressed)
      expect(spatializedElement.updateProperties.mock.calls.length).toBe(
        callsAfterFirst,
      )
    })
  })

  // ============================================================
  // isFieldSuppressed API
  // ============================================================
  describe('isFieldSuppressed API', () => {
    it('returns true for suppressed fields', () => {
      const { portal } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity', 'transform']))
      expect(portal.isFieldSuppressed('opacity')).toBe(true)
      expect(portal.isFieldSuppressed('transform')).toBe(true)
    })

    it('returns false for non-suppressed fields', () => {
      const { portal } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity']))
      expect(portal.isFieldSuppressed('transform')).toBe(false)
      expect(portal.isFieldSuppressed('width')).toBe(false)
      expect(portal.isFieldSuppressed('height')).toBe(false)
    })

    it('returns false after suppression is released', () => {
      const { portal } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity', 'transform']))
      expect(portal.isFieldSuppressed('opacity')).toBe(true)

      portal.setSuppressedFields(null)
      expect(portal.isFieldSuppressed('opacity')).toBe(false)
      expect(portal.isFieldSuppressed('transform')).toBe(false)
    })

    it('returns false when no suppression has been set', () => {
      const { portal } = createPortalWithElement()
      expect(portal.isFieldSuppressed('opacity')).toBe(false)
      expect(portal.isFieldSuppressed('transform')).toBe(false)
    })
  })

  // ============================================================
  // Width/height/depth/backOffset suppression
  // ============================================================
  describe('layout field suppression', () => {
    it('width/height/depth/backOffset can be independently suppressed', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      portal.setSuppressedFields(
        new Set(['width', 'height', 'depth', 'backOffset']),
      )
      spatializedElement.updateProperties.mockClear()

      portal.notify2DFrameChange()

      const lastCall =
        spatializedElement.updateProperties.mock.calls[
          spatializedElement.updateProperties.mock.calls.length - 1
        ]
      expect(lastCall[0]).not.toHaveProperty('width')
      expect(lastCall[0]).not.toHaveProperty('height')
      expect(lastCall[0]).not.toHaveProperty('depth')
      expect(lastCall[0]).not.toHaveProperty('backOffset')
      // opacity should still be there
      expect(lastCall[0]).toHaveProperty('opacity')
    })
  })

  // ============================================================
  // Multiple sync cycles during suppression
  // ============================================================
  describe('multiple sync cycles during suppression', () => {
    it('suppressed fields remain absent across multiple notify2DFrameChange calls', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity', 'transform']))

      // Multiple sync cycles
      for (let i = 0; i < 5; i++) {
        spatializedElement.updateProperties.mockClear()
        spatializedElement.updateTransform.mockClear()
        portal.notify2DFrameChange()

        const lastCall =
          spatializedElement.updateProperties.mock.calls[
            spatializedElement.updateProperties.mock.calls.length - 1
          ]
        expect(lastCall[0]).not.toHaveProperty('opacity')
        expect(spatializedElement.updateTransform).not.toHaveBeenCalled()
      }
    })

    it('after release, subsequent notify2DFrameChange includes all fields', () => {
      const { portal, spatializedElement } = createPortalWithElement()

      portal.setSuppressedFields(new Set(['opacity']))
      portal.notify2DFrameChange()

      // Release
      portal.setSuppressedFields(null)
      spatializedElement.updateProperties.mockClear()

      // Next sync cycle
      portal.notify2DFrameChange()

      const lastCall =
        spatializedElement.updateProperties.mock.calls[
          spatializedElement.updateProperties.mock.calls.length - 1
        ]
      expect(lastCall[0]).toHaveProperty('opacity', 0.7)
    })
  })
})
