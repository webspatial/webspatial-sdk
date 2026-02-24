import { afterEach, describe, expect, it, vi } from 'vitest'
import { composeSRT, parseCornerRadius } from './utils'
import {
  CommandResultFailure,
  CommandResultSuccess,
} from './platform-adapter/CommandResultUtils'
import { SpatialWebEvent } from './SpatialWebEvent'
import { createSpatialEvent } from './SpatialWebEventCreator'
import {
  isValidBaseplateVisibilityType,
  isValidSceneUnit,
  isValidSpatialSceneType,
  isValidWorldAlignmentType,
  isValidWorldScalingType,
} from './types/types'

describe('utils', () => {
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

  it('composeSRT composes translate and scale in expected order', () => {
    if (!(globalThis as any).DOMMatrix) {
      class DOMMatrixPolyfill {
        private tx = 0
        private ty = 0
        private tz = 0
        private sx = 1
        private sy = 1
        private sz = 1

        translate(x = 0, y = 0, z = 0) {
          this.tx += x
          this.ty += y
          this.tz += z
          return this
        }

        rotate() {
          return this
        }

        scale(x = 1, y = 1, z = 1) {
          this.sx *= x
          this.sy *= y
          this.sz *= z
          return this
        }

        transformPoint(p: { x: number; y: number; z?: number }) {
          return {
            x: p.x * this.sx + this.tx,
            y: p.y * this.sy + this.ty,
            z: (p.z ?? 0) * this.sz + this.tz,
          }
        }
      }
      ;(globalThis as any).DOMMatrix = DOMMatrixPolyfill
    }

    const m = composeSRT(
      { x: 10, y: 20, z: 30 },
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 3, z: 4 },
    )

    const origin = m.transformPoint({ x: 0, y: 0, z: 0 })
    expect(origin).toEqual({
      x: 10,
      y: 20,
      z: 30,
    })

    const p = m.transformPoint({ x: 1, y: 1, z: 1 })
    expect(p).toEqual({ x: 12, y: 23, z: 34 })
  })
})

describe('types validators', () => {
  it('validates enum-like string unions', () => {
    expect(isValidBaseplateVisibilityType('automatic')).toBe(true)
    expect(isValidBaseplateVisibilityType('nope')).toBe(false)

    expect(isValidWorldScalingType('dynamic')).toBe(true)
    expect(isValidWorldScalingType('nope')).toBe(false)

    expect(isValidWorldAlignmentType('gravityAligned')).toBe(true)
    expect(isValidWorldAlignmentType('nope')).toBe(false)

    expect(isValidSpatialSceneType('window')).toBe(true)
    expect(isValidSpatialSceneType('nope')).toBe(false)
  })

  it('validates scene units', () => {
    expect(isValidSceneUnit(0)).toBe(true)
    expect(isValidSceneUnit(-1)).toBe(false)
    expect(isValidSceneUnit('10px')).toBe(true)
    expect(isValidSceneUnit('10m')).toBe(true)
    expect(isValidSceneUnit('10cm')).toBe(false)
    expect(isValidSceneUnit('px')).toBe(true)
    expect(isValidSceneUnit('apx')).toBe(false)
  })
})

describe('CommandResultUtils', () => {
  it('creates success and failure results', () => {
    expect(CommandResultSuccess({ a: 1 })).toEqual({
      success: true,
      data: { a: 1 },
      errorCode: '',
      errorMessage: '',
    })

    expect(CommandResultFailure('E_TEST', 'bad')).toEqual({
      success: false,
      data: undefined,
      errorCode: 'E_TEST',
      errorMessage: 'bad',
    })
  })
})

describe('SpatialWebEvent', () => {
  it('dispatches to registered receiver', () => {
    SpatialWebEvent.init()
    const cb = vi.fn()
    SpatialWebEvent.addEventReceiver('id1', cb)

    window.__SpatialWebEvent({ id: 'id1', data: { ok: true } })
    expect(cb).toHaveBeenCalledWith({ ok: true })

    SpatialWebEvent.removeEventReceiver('id1')
    window.__SpatialWebEvent({ id: 'id1', data: { ok: false } })
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('SpatialWebEventCreator', () => {
  it('creates a bubbling custom event with detail', () => {
    const ev = createSpatialEvent('spatialmsg' as any, { x: 1 })
    expect(ev.type).toBe('spatialmsg')
    expect(ev.bubbles).toBe(true)
    expect(ev.cancelable).toBe(false)
    expect(ev.detail).toEqual({ x: 1 })
  })
})

describe('SpatialObject', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unmock('./JSBCommand')
  })

  it('inspect returns data when command succeeds', async () => {
    vi.doMock('./JSBCommand', () => {
      return {
        InspectCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: { a: 1 },
            errorMessage: '',
          }),
        })),
        DestroyCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: undefined,
            errorMessage: '',
          }),
        })),
      }
    })

    const { SpatialObject } = await import('./SpatialObject')
    const obj = new SpatialObject('id')
    await expect(obj.inspect()).resolves.toEqual({ a: 1 })
  })

  it('inspect throws when command fails', async () => {
    vi.doMock('./JSBCommand', () => {
      return {
        InspectCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: false,
            data: undefined,
            errorMessage: 'nope',
          }),
        })),
        DestroyCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: undefined,
            errorMessage: '',
          }),
        })),
      }
    })

    const { SpatialObject } = await import('./SpatialObject')
    const obj = new SpatialObject('id')
    await expect(obj.inspect()).rejects.toThrow('nope')
  })

  it('destroy calls onDestroy once and is idempotent', async () => {
    const onDestroy = vi.fn()
    vi.doMock('./JSBCommand', () => {
      return {
        InspectCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: undefined,
            errorMessage: '',
          }),
        })),
        DestroyCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: { ok: true },
            errorMessage: '',
          }),
        })),
      }
    })

    const { SpatialObject } = await import('./SpatialObject')
    class TestObject extends SpatialObject {
      protected onDestroy() {
        onDestroy()
      }
    }

    const obj = new TestObject('id')
    await expect(obj.destroy()).resolves.toEqual({ ok: true })
    expect(obj.isDestroyed).toBe(true)
    expect(onDestroy).toHaveBeenCalledTimes(1)
    await expect(obj.destroy()).resolves.toBeUndefined()
    expect(onDestroy).toHaveBeenCalledTimes(1)
  })
})

describe('platform adapters', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
    vi.clearAllMocks()
    vi.unmock('./JSBCommand')
  })

  // it('AndroidPlatform.callJSB resolves from async SpatialWebEvent callback', async () => {
  //   const postMessage = vi.fn((rId: string) => {
  //     expect(rId.startsWith('rId_')).toBe(true)
  //     return ''
  //   })
  //   ;(window as any).webspatialBridge = { postMessage }

  //   const { AndroidPlatform } = await import(
  //     './platform-adapter/android/AndroidPlatform'
  //   )
  //   const { SpatialWebEvent: SpatialWebEventInstance } = await import(
  //     './SpatialWebEvent'
  //   )
  //   const platform = new AndroidPlatform()
  //   const p = platform.callJSB('c', '{"a":1}')

  //   const rId = postMessage.mock.calls[0]?.[0] as string
  //   SpatialWebEventInstance.eventReceiver[rId]({
  //     success: true,
  //     data: { ok: true },
  //   })

  //   await expect(p).resolves.toEqual({
  //     success: true,
  //     data: { ok: true },
  //     errorCode: '',
  //     errorMessage: '',
  //   })
  // })

  // it('AndroidPlatform.callJSB handles sync bridge response and failures', async () => {
  //   ;(window as any).webspatialBridge = {
  //     postMessage: vi.fn(() =>
  //       JSON.stringify({
  //         success: false,
  //         data: { code: 'E_SYNC', message: 'bad' },
  //       }),
  //     ),
  //   }

  //   const { AndroidPlatform } = await import(
  //     './platform-adapter/android/AndroidPlatform'
  //   )
  //   const platform = new AndroidPlatform()
  //   await expect(platform.callJSB('c', '{}')).resolves.toEqual({
  //     success: false,
  //     data: undefined,
  //     errorCode: 'E_SYNC',
  //     errorMessage: 'bad',
  //   })
  // })

  // it('AndroidPlatform.callWebSpatialProtocol polls and returns injected SpatialId', async () => {
  //   vi.useFakeTimers()

  //   let canCount = 0
  //   vi.doMock('./JSBCommand', () => {
  //     return {
  //       CheckWebViewCanCreateCommand: vi.fn().mockImplementation(() => ({
  //         execute: vi.fn().mockImplementation(() => {
  //           canCount += 1
  //           return Promise.resolve({
  //             success: true,
  //             data: { can: canCount >= 2 },
  //             errorCode: '',
  //             errorMessage: '',
  //           })
  //         }),
  //       })),
  //     }
  //   })

  //   const windowProxy: any = {}
  //   const openFn = vi.fn()
  //   ;(window as any).open = vi.fn(() => windowProxy)

  //   setTimeout(() => {
  //     windowProxy.open = openFn
  //   }, 20)

  //   const { AndroidPlatform } = await import(
  //     './platform-adapter/android/AndroidPlatform'
  //   )
  //   const { SpatialWebEvent: SpatialWebEventInstance } = await import(
  //     './SpatialWebEvent'
  //   )
  //   const platform = new AndroidPlatform()
  //   const p = platform.callWebSpatialProtocol('open', 'x=1', '_blank', '')

  //   const receiverIds = Object.keys(SpatialWebEventInstance.eventReceiver)
  //   const createdId = receiverIds[0] as string
  //   const loadedId = receiverIds[1] as string
  //   SpatialWebEventInstance.eventReceiver[createdId]?.({ spatialId: 'temp' })
  //   await vi.advanceTimersByTimeAsync(100)
  //   SpatialWebEventInstance.eventReceiver[loadedId]?.({
  //     spatialId: 'spatial-1',
  //   })

  //   await vi.advanceTimersByTimeAsync(200)

  //   const result = await p
  //   expect(result.success).toBe(true)
  //   expect(result.data.id).toBe('spatial-1')
  //   expect(result.data.windowProxy).toBe(windowProxy)
  //   const call = openFn.mock.calls[0] as unknown as [string, string | undefined]
  //   expect(call?.[0]).toMatch(/^about:blank\?rid=/)
  //   expect(call?.[1]).toBe('_self')
  // })

  it('SSRPlatform returns successful no-op results', async () => {
    const { SSRPlatform } = await import('./platform-adapter/ssr/SSRPlatform')
    const platform = new SSRPlatform()

    await expect(platform.callJSB('c', '{}')).resolves.toMatchObject({
      success: true,
    })
    await expect(
      platform.callWebSpatialProtocol('s', '', '', ''),
    ).resolves.toMatchObject({
      success: true,
    })
    expect(platform.callWebSpatialProtocolSync('s', '', '', '')).toMatchObject({
      success: true,
    })
  })

  it('VisionOSPlatform.callJSB returns success and parses failures', async () => {
    ;(window as any).webkit = {
      messageHandlers: {
        bridge: {
          postMessage: vi
            .fn()
            .mockResolvedValueOnce({ a: 1 })
            .mockRejectedValueOnce({
              message: JSON.stringify({ code: 'E_VOS', message: 'nope' }),
            }),
        },
      },
    }

    const { VisionOSPlatform } = await import(
      './platform-adapter/vision-os/VisionOSPlatform'
    )
    const platform = new VisionOSPlatform()

    await expect(platform.callJSB('c', '{}')).resolves.toEqual({
      success: true,
      data: { a: 1 },
      errorCode: '',
      errorMessage: '',
    })

    await expect(platform.callJSB('c', '{}')).resolves.toEqual({
      success: false,
      data: undefined,
      errorCode: 'E_VOS',
      errorMessage: 'nope',
    })
  })

  it('VisionOSPlatform parses SpatialId from userAgent', async () => {
    const uuid = '12345678-1234-1234-1234-1234567890ab'
    const windowProxy: any = {
      navigator: { userAgent: `x ${uuid} y` },
    }
    ;(window as any).open = vi.fn(() => windowProxy)
    ;(window as any).webkit = {
      messageHandlers: { bridge: { postMessage: vi.fn() } },
    }

    const { VisionOSPlatform } = await import(
      './platform-adapter/vision-os/VisionOSPlatform'
    )
    const platform = new VisionOSPlatform()
    const r = await platform.callWebSpatialProtocol('open', 'a=1')

    expect(r.success).toBe(true)
    expect(r.data.id).toBe(uuid)
    expect(r.data.windowProxy).toBe(windowProxy)
  })
})

describe('geometries', () => {
  it('constructs cone/cylinder/plane/sphere geometries', async () => {
    const { SpatialConeGeometry } = await import(
      './reality/geometry/SpatialConeGeometry'
    )
    const { SpatialCylinderGeometry } = await import(
      './reality/geometry/SpatialCylinderGeometry'
    )
    const { SpatialPlaneGeometry } = await import(
      './reality/geometry/SpatialPlaneGeometry'
    )
    const { SpatialSphereGeometry } = await import(
      './reality/geometry/SpatialSphereGeometry'
    )

    const cone = new SpatialConeGeometry('c1', { radius: 1, height: 2 })
    const cylinder = new SpatialCylinderGeometry('cy1', {
      radius: 1,
      height: 2,
    })
    const plane = new SpatialPlaneGeometry('p1', { width: 1 })
    const sphere = new SpatialSphereGeometry('s1', { radius: 1 })

    expect(SpatialConeGeometry.type).toBe('ConeGeometry')
    expect(SpatialCylinderGeometry.type).toBe('CylinderGeometry')
    expect(SpatialPlaneGeometry.type).toBe('PlaneGeometry')
    expect(SpatialSphereGeometry.type).toBe('SphereGeometry')

    expect(cone.id).toBe('c1')
    expect(cylinder.id).toBe('cy1')
    expect(plane.id).toBe('p1')
    expect(sphere.id).toBe('s1')
  })
})

describe('spatialWindowPolyfill', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unmock('./Spatial')
  })

  it('returns early when not running in SpatialWeb', async () => {
    vi.doMock('./Spatial', () => {
      return {
        Spatial: class {
          runInSpatialWeb() {
            return false
          }
          requestSession() {
            throw new Error('should not be called')
          }
        },
      }
    })

    const { spatialWindowPolyfill } = await import('./spatial-window-polyfill')
    await expect(spatialWindowPolyfill()).resolves.toBeUndefined()
  })

  it('updates scene properties and reacts to background material changes', async () => {
    const updateSpatialProperties = vi.fn()
    const mockSession: any = {
      getSpatialScene: () => ({
        updateSpatialProperties,
      }),
    }

    vi.doMock('./Spatial', () => {
      return {
        Spatial: class {
          runInSpatialWeb() {
            return true
          }
          requestSession() {
            return mockSession
          }
        },
      }
    })

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    })

    document.documentElement.style.width = '200px'
    document.documentElement.style.setProperty(
      '--xr-background-material',
      'translucent',
    )
    document.documentElement.style.setProperty('border-top-left-radius', '10px')
    document.documentElement.style.setProperty('border-top-right-radius', '5%')
    document.documentElement.style.opacity = '0.5'

    const { spatialWindowPolyfill } = await import('./spatial-window-polyfill')
    await spatialWindowPolyfill()

    expect(updateSpatialProperties).toHaveBeenCalledWith({
      material: 'translucent',
    })
    expect(updateSpatialProperties).toHaveBeenCalledWith({
      cornerRadius: {
        topLeading: 10,
        topTrailing: 10,
        bottomLeading: 0,
        bottomTrailing: 0,
      },
    })
    expect(updateSpatialProperties).toHaveBeenCalledWith({
      opacity: 0.5,
    })

    document.documentElement.style.setProperty(
      '--xr-background-material',
      'regular',
    )
    expect(updateSpatialProperties).toHaveBeenCalledWith({
      material: 'regular',
    })

    document.documentElement.style.removeProperty('--xr-background-material')
    expect(updateSpatialProperties).toHaveBeenCalledWith({
      material: 'none',
    })
  })
})

describe('SpatializedElementCreator', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unmock('./JSBCommand')
  })

  it('createSpatialized2DElement sets base href and returns element', async () => {
    const windowProxy: any = {
      document: { head: { innerHTML: '' } },
    }

    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedStatic3DElementProperties: OkCommand,
        UpdateSpatializedDynamic3DElementProperties: OkCommand,
        SetParentForEntityCommand: OkCommand,
        AddEntityToDynamic3DCommand: OkCommand,
        createSpatialized2DElementCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: true,
            data: { id: 'w1', windowProxy },
            errorCode: '',
            errorMessage: '',
          }),
        })),
        CreateSpatializedStatic3DElementCommand: vi
          .fn()
          .mockImplementation(() => ({
            execute: vi.fn().mockResolvedValue({
              success: true,
              data: { id: 's-default' },
              errorCode: '',
              errorMessage: '',
            }),
          })),
        CreateSpatializedDynamic3DElementCommand: vi
          .fn()
          .mockImplementation(() => ({
            execute: vi.fn().mockResolvedValue({
              success: true,
              data: { id: 'd-default' },
              errorCode: '',
              errorMessage: '',
            }),
          })),
      }
    })

    const { createSpatialized2DElement } = await import(
      './SpatializedElementCreator'
    )
    const el = await createSpatialized2DElement()

    expect(el.id).toBe('w1')
    expect(windowProxy.document.head.innerHTML).toContain('<base href="')
    expect(windowProxy.document.head.innerHTML).toContain(document.baseURI)
  })

  it('createSpatialized2DElement throws when command fails', async () => {
    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedStatic3DElementProperties: OkCommand,
        UpdateSpatializedDynamic3DElementProperties: OkCommand,
        SetParentForEntityCommand: OkCommand,
        AddEntityToDynamic3DCommand: OkCommand,
        createSpatialized2DElementCommand: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: false,
            data: undefined,
            errorCode: 'E',
            errorMessage: 'bad',
          }),
        })),
        CreateSpatializedStatic3DElementCommand: vi.fn(),
        CreateSpatializedDynamic3DElementCommand: vi.fn(),
      }
    })

    const { createSpatialized2DElement } = await import(
      './SpatializedElementCreator'
    )
    await expect(createSpatialized2DElement()).rejects.toThrow(
      'createSpatialized2DElement failed',
    )
  })

  it('createSpatializedStatic3DElement returns element and throws on failure', async () => {
    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedStatic3DElementProperties: OkCommand,
        UpdateSpatializedDynamic3DElementProperties: OkCommand,
        SetParentForEntityCommand: OkCommand,
        AddEntityToDynamic3DCommand: OkCommand,
        createSpatialized2DElementCommand: vi.fn(),
        CreateSpatializedDynamic3DElementCommand: vi.fn(),
        CreateSpatializedStatic3DElementCommand: vi
          .fn()
          .mockImplementationOnce(() => ({
            execute: vi.fn().mockResolvedValue({
              success: true,
              data: { id: 's3' },
              errorCode: '',
              errorMessage: '',
            }),
          }))
          .mockImplementationOnce(() => ({
            execute: vi.fn().mockResolvedValue({
              success: false,
              data: undefined,
              errorCode: 'E',
              errorMessage: 'bad',
            }),
          })),
      }
    })

    const { createSpatializedStatic3DElement } = await import(
      './SpatializedElementCreator'
    )
    const ok = await createSpatializedStatic3DElement('u')
    expect(ok.id).toBe('s3')

    await expect(createSpatializedStatic3DElement('u')).rejects.toThrow(
      'createSpatializedStatic3DElement failed',
    )
  })

  it('createSpatializedDynamic3DElement returns element and throws on failure', async () => {
    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedStatic3DElementProperties: OkCommand,
        UpdateSpatializedDynamic3DElementProperties: OkCommand,
        SetParentForEntityCommand: OkCommand,
        AddEntityToDynamic3DCommand: OkCommand,
        createSpatialized2DElementCommand: vi.fn(),
        CreateSpatializedStatic3DElementCommand: vi.fn(),
        CreateSpatializedDynamic3DElementCommand: vi
          .fn()
          .mockImplementationOnce(() => ({
            execute: vi.fn().mockResolvedValue({
              success: true,
              data: { id: 'd3' },
              errorCode: '',
              errorMessage: '',
            }),
          }))
          .mockImplementationOnce(() => ({
            execute: vi.fn().mockResolvedValue({
              success: false,
              data: undefined,
              errorCode: 'E',
              errorMessage: 'bad',
            }),
          })),
      }
    })

    const { createSpatializedDynamic3DElement } = await import(
      './SpatializedElementCreator'
    )
    const ok = await createSpatializedDynamic3DElement()
    expect(ok.id).toBe('d3')

    await expect(createSpatializedDynamic3DElement()).rejects.toThrow(
      'createSpatializedDynamic3DElement failed',
    )
  })
})

describe('SpatializedStatic3DElement', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unmock('./JSBCommand')
  })

  it('resets ready when modelURL changes and resolves on load events', async () => {
    const execute = vi.fn().mockResolvedValue({
      success: true,
      data: undefined,
      errorCode: '',
      errorMessage: '',
    })
    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedDynamic3DElementProperties: OkCommand,
        SetParentForEntityCommand: OkCommand,
        AddEntityToDynamic3DCommand: OkCommand,
        createSpatialized2DElementCommand: vi.fn(),
        CreateSpatializedStatic3DElementCommand: vi.fn(),
        CreateSpatializedDynamic3DElementCommand: vi.fn(),
        UpdateSpatializedStatic3DElementProperties: vi
          .fn()
          .mockImplementation(() => ({ execute })),
      }
    })

    const { SpatializedStatic3DElement } = await import(
      './SpatializedStatic3DElement'
    )
    const { SpatialWebMsgType } = await import('./WebMsgCommand')

    const el = new SpatializedStatic3DElement('m1')
    const onLoad = vi.fn()
    const onFail = vi.fn()
    el.onLoadCallback = onLoad
    el.onLoadFailureCallback = onFail

    const p1 = el.ready
    await el.updateProperties({ modelURL: 'a.glb' } as any)
    expect(execute).toHaveBeenCalledTimes(1)
    const p2 = el.ready
    expect(p2).not.toBe(p1)

    el.onReceiveEvent({ type: SpatialWebMsgType.modelloaded } as any)
    await expect(p2).resolves.toBe(true)
    expect(onLoad).toHaveBeenCalledTimes(1)

    await el.updateProperties({ modelURL: 'b.glb' } as any)
    const p3 = el.ready
    el.onReceiveEvent({ type: SpatialWebMsgType.modelloadfailed } as any)
    await expect(p3).resolves.toBe(false)
    expect(onFail).toHaveBeenCalledTimes(1)
  })

  it('updateModelTransform passes float64 array to updateProperties', async () => {
    const execute = vi.fn().mockResolvedValue({
      success: true,
      data: undefined,
      errorCode: '',
      errorMessage: '',
    })
    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedDynamic3DElementProperties: OkCommand,
        SetParentForEntityCommand: OkCommand,
        AddEntityToDynamic3DCommand: OkCommand,
        createSpatialized2DElementCommand: vi.fn(),
        CreateSpatializedStatic3DElementCommand: vi.fn(),
        CreateSpatializedDynamic3DElementCommand: vi.fn(),
        UpdateSpatializedStatic3DElementProperties: vi
          .fn()
          .mockImplementation(() => ({ execute })),
      }
    })

    const { SpatializedStatic3DElement } = await import(
      './SpatializedStatic3DElement'
    )

    class DOMMatrixWithArray {
      toFloat64Array() {
        return new Float64Array([
          1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1,
        ])
      }
    }

    const el = new SpatializedStatic3DElement('m2')
    el.updateModelTransform(new DOMMatrixWithArray() as any)
    expect(execute).toHaveBeenCalledTimes(1)
  })
})

describe('SpatializedDynamic3DElement', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unmock('./JSBCommand')
  })

  it('addEntity sets parent, pushes children, and calls SetParentForEntityCommand', async () => {
    const execute = vi.fn().mockResolvedValue({
      success: true,
      data: undefined,
      errorCode: '',
      errorMessage: '',
    })
    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedStatic3DElementProperties: OkCommand,
        UpdateSpatializedDynamic3DElementProperties: OkCommand,
        createSpatialized2DElementCommand: vi.fn(),
        CreateSpatializedStatic3DElementCommand: vi.fn(),
        CreateSpatializedDynamic3DElementCommand: vi.fn(),
        AddEntityToDynamic3DCommand: OkCommand,
        SetParentForEntityCommand: vi
          .fn()
          .mockImplementation(() => ({ execute })),
      }
    })

    const { SpatializedDynamic3DElement } = await import(
      './SpatializedDynamic3DElement'
    )
    const el = new SpatializedDynamic3DElement('d1')

    const entity: any = { id: 'e1', parent: undefined }
    await el.addEntity(entity)

    expect(entity.parent).toBe(el)
    expect(el.children).toContain(entity)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('updateProperties calls UpdateSpatializedDynamic3DElementProperties', async () => {
    const execute = vi.fn().mockResolvedValue({
      success: true,
      data: undefined,
      errorCode: '',
      errorMessage: '',
    })
    vi.doMock('./JSBCommand', () => {
      class OkCommand {
        execute() {
          return Promise.resolve({
            success: true,
            data: undefined,
            errorCode: '',
            errorMessage: '',
          })
        }
      }

      return {
        InspectCommand: OkCommand,
        DestroyCommand: OkCommand,
        UpdateSpatializedElementTransform: OkCommand,
        UpdateSpatialized2DElementProperties: OkCommand,
        AddSpatializedElementToSpatialized2DElement: OkCommand,
        UpdateSpatializedStatic3DElementProperties: OkCommand,
        SetParentForEntityCommand: OkCommand,
        AddEntityToDynamic3DCommand: OkCommand,
        createSpatialized2DElementCommand: vi.fn(),
        CreateSpatializedStatic3DElementCommand: vi.fn(),
        CreateSpatializedDynamic3DElementCommand: vi.fn(),
        UpdateSpatializedDynamic3DElementProperties: vi
          .fn()
          .mockImplementation(() => ({ execute })),
      }
    })

    const { SpatializedDynamic3DElement } = await import(
      './SpatializedDynamic3DElement'
    )
    const el = new SpatializedDynamic3DElement('d2')
    await el.updateProperties({ visible: true } as any)
    expect(execute).toHaveBeenCalledTimes(1)
  })
})

describe('ssr-polyfill', () => {
  it('isSSREnv returns false in jsdom', async () => {
    const { isSSREnv } = await import('./ssr-polyfill')
    expect(isSSREnv()).toBe(false)
  })
})

describe('platform-adapter', () => {
  it('createPlatform returns SSRPlatform in SSR env', async () => {
    vi.resetModules()
    vi.doMock('./ssr-polyfill', () => {
      return { isSSREnv: () => true }
    })

    const { createPlatform } = await import('./platform-adapter')
    const p = createPlatform() as any
    expect(typeof p.callJSB).toBe('function')
    expect(typeof p.callWebSpatialProtocol).toBe('function')
    expect(typeof p.callWebSpatialProtocolSync).toBe('function')
  })
})
