import { beforeEach, describe, expect, it, vi } from 'vitest'

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

  inverse() {
    return new DOMMatrixPolyfill()
  }

  transformPoint(p: { x: number; y: number; z?: number }) {
    return {
      x: p.x * this.sx + this.tx,
      y: p.y * this.sy + this.ty,
      z: (p.z ?? 0) * this.sz + this.tz,
    }
  }

  toFloat64Array() {
    const out = new Float64Array(16)
    out[0] = this.sx
    out[5] = this.sy
    out[10] = this.sz
    out[12] = this.tx
    out[13] = this.ty
    out[14] = this.tz
    out[15] = 1
    return out
  }
}

;(globalThis as any).DOMMatrix = DOMMatrixPolyfill

const platformSpy = {
  callJSB: vi.fn(),
  callWebSpatialProtocol: vi.fn(),
  callWebSpatialProtocolSync: vi.fn(),
}

vi.mock('./platform-adapter', () => ({
  createPlatform: () => platformSpy,
}))

function ok(data: any = {}) {
  return Promise.resolve({
    success: true,
    data,
    errorCode: '',
    errorMessage: '',
  })
}

function parseQuery(q?: string) {
  const sp = new URLSearchParams(q ?? '')
  const out: Record<string, string> = {}
  for (const [k, v] of sp.entries()) out[k] = v
  return out
}

describe('JSBCommand', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callWebSpatialProtocol.mockReset()
    platformSpy.callWebSpatialProtocolSync.mockReset()
    platformSpy.callJSB.mockImplementation(() => ok({ id: 'id-1' }))
    platformSpy.callWebSpatialProtocol.mockImplementation(() =>
      ok({ windowProxy: {}, id: 'spatial-1' }),
    )
    platformSpy.callWebSpatialProtocolSync.mockImplementation(() => ({
      success: true,
      data: { windowProxy: {}, id: 'spatial-1' },
      errorCode: '',
      errorMessage: '',
    }))
  })

  it('serializes params and calls platform.callJSB', async () => {
    const mod = await import('./JSBCommand')
    const { FocusScene, InspectCommand, DestroyCommand, UpdateSceneConfig } =
      mod

    await new FocusScene('scene-1').execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'FocusScene',
      JSON.stringify({ id: 'scene-1' }),
    )

    await new InspectCommand().execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'Inspect',
      JSON.stringify({ id: '' }),
    )

    await new DestroyCommand('obj-1').execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'Destroy',
      JSON.stringify({ id: 'obj-1' }),
    )

    await new UpdateSceneConfig({ type: 'window' } as any).execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateSceneConfig',
      JSON.stringify({ config: { type: 'window' } }),
    )
  })

  it('builds element commands payloads', async () => {
    const mod = await import('./JSBCommand')
    const {
      UpdateSpatializedElementTransform,
      UpdateSpatialized2DElementProperties,
      UpdateSpatializedDynamic3DElementProperties,
      UpdateSpatializedStatic3DElementProperties,
      AddSpatializedElementToSpatialScene,
      AddSpatializedElementToSpatialized2DElement,
      UpdateUnlitMaterialProperties,
    } = mod

    const obj = { id: 'so-1' } as any
    const ele = { id: 'ele-1' } as any
    const matrix = new DOMMatrixPolyfill().translate(1, 2, 3)

    await new UpdateSpatializedElementTransform(obj, matrix as any).execute()
    const last = platformSpy.callJSB.mock.calls.at(-1)
    expect(last?.[0]).toBe('UpdateSpatializedElementTransform')
    expect(JSON.parse(last?.[1])).toEqual({
      id: 'so-1',
      matrix: Array.from(matrix.toFloat64Array()),
    })

    await new UpdateSpatialized2DElementProperties(obj, {
      a: 1,
    } as any).execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateSpatialized2DElementProperties',
      JSON.stringify({ id: 'so-1', a: 1 }),
    )

    await new UpdateSpatializedDynamic3DElementProperties(obj, {
      b: 2,
    } as any).execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateSpatializedDynamic3DElementProperties',
      JSON.stringify({ id: 'so-1', b: 2 }),
    )

    await new UpdateSpatializedStatic3DElementProperties(obj, {
      c: 3,
    } as any).execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateSpatializedStatic3DElementProperties',
      JSON.stringify({ id: 'so-1', c: 3 }),
    )

    await new AddSpatializedElementToSpatialScene(ele).execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'AddSpatializedElementToSpatialScene',
      JSON.stringify({ spatializedElementId: 'ele-1' }),
    )

    await new AddSpatializedElementToSpatialized2DElement(obj, ele).execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'AddSpatializedElementToSpatialized2DElement',
      JSON.stringify({ id: 'so-1', spatializedElementId: 'ele-1' }),
    )

    await new UpdateUnlitMaterialProperties(obj, { color: '#fff' }).execute()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateUnlitMaterialProperties',
      JSON.stringify({ id: 'so-1', color: '#fff' }),
    )
  })

  it('creates query string and calls WebSpatialProtocol', async () => {
    const mod = await import('./JSBCommand')
    const { createSpatialSceneCommand, createSpatialized2DElementCommand } = mod

    await new createSpatialized2DElementCommand().execute()
    expect(platformSpy.callWebSpatialProtocol).toHaveBeenCalledWith(
      'createSpatialized2DElement',
      '',
      undefined,
      undefined,
    )

    const cmd = new createSpatialSceneCommand(
      'https://example.com/a?b=c',
      { type: 'window', defaultSize: { width: 1, height: 2 } } as any,
      '_self',
      'popup=1',
    )
    await cmd.execute()
    const call = platformSpy.callWebSpatialProtocol.mock.calls.at(-1)
    expect(call?.[0]).toBe('createSpatialScene')
    expect(call?.[2]).toBe('_self')
    expect(call?.[3]).toBe('popup=1')
    const q = parseQuery(call?.[1])
    expect(q.url).toBe('https://example.com/a?b=c')
    expect(JSON.parse(q.config)).toEqual({
      type: 'window',
      defaultSize: { width: 1, height: 2 },
    })

    cmd.executeSync()
    expect(platformSpy.callWebSpatialProtocolSync).toHaveBeenCalled()
  })
})

describe('SpatialObject', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callJSB.mockImplementation((cmd: string) => {
      if (cmd === 'Inspect') return ok({ inspected: true })
      if (cmd === 'Destroy') return ok({ destroyed: true })
      return ok({ id: 'id-1' })
    })
  })

  it('inspects and destroys', async () => {
    const { SpatialObject } = await import('./SpatialObject')

    class TestObj extends SpatialObject {
      onDestroySpy = vi.fn()
      protected override onDestroy() {
        this.onDestroySpy()
      }
    }

    const o = new TestObj('obj-1')
    await expect(o.inspect()).resolves.toEqual({ inspected: true })

    await expect(o.destroy()).resolves.toEqual({ destroyed: true })
    expect(o.isDestroyed).toBe(true)
    expect(o.onDestroySpy).toHaveBeenCalledTimes(1)

    await o.destroy()
    expect(
      platformSpy.callJSB.mock.calls.filter(c => c[0] === 'Destroy'),
    ).toHaveLength(1)
  })
})

describe('realityCreator', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callJSB.mockImplementation((cmd: string) => {
      if (cmd === 'CreateSpatialEntity') return ok({ id: 'ent-1' })
      if (cmd === 'CreateGeometry') return ok({ id: 'geo-1' })
      if (cmd === 'CreateUnlitMaterial') return ok({ id: 'mat-1' })
      if (cmd === 'CreateModelComponent') return ok({ id: 'cmp-1' })
      if (cmd === 'CreateSpatialModelEntity') return ok({ id: 'ment-1' })
      if (cmd === 'CreateModelAsset') return ok({ id: 'asset-1' })
      return ok({ id: 'id-1' })
    })
  })

  it('creates entities, geometry, materials, components, assets', async () => {
    const creator = await import('./reality/realityCreator')
    const geo = await import('./reality/geometry/SpatialBoxGeometry')
    const mat = await import('./reality/material/SpatialUnlitMaterial')
    const cmp = await import('./reality/component/ModelComponent')
    const asset = await import('./reality/resource/SpatialModelAsset')
    const ent = await import('./reality/entity/SpatialEntity')
    const modelEnt = await import('./reality/entity/SpatialModelEntity')

    await expect(
      creator.createSpatialEntity({ name: 'n' }),
    ).resolves.toBeInstanceOf(ent.SpatialEntity)

    await expect(
      creator.createSpatialGeometry(
        geo.SpatialBoxGeometry as any,
        { width: 1 } as any,
      ),
    ).resolves.toBeInstanceOf(geo.SpatialBoxGeometry)

    await expect(
      creator.createSpatialUnlitMaterial({ color: '#fff' }),
    ).resolves.toBeInstanceOf(mat.SpatialUnlitMaterial)

    await expect(
      creator.createModelComponent({
        mesh: { id: 'geo-1' } as any,
        materials: [{ id: 'mat-1' }] as any,
      }),
    ).resolves.toBeInstanceOf(cmp.ModelComponent)

    await expect(
      creator.createModelAsset({ url: 'https://example.com/a.glb' }),
    ).resolves.toBeInstanceOf(asset.SpatialModelAsset)

    await expect(
      creator.createSpatialModelEntity(
        { modelAssetId: 'asset-1' },
        { name: 'u' },
      ),
    ).resolves.toBeInstanceOf(modelEnt.SpatialModelEntity)
  })

  it('throws on creator failures', async () => {
    platformSpy.callJSB.mockResolvedValueOnce({
      success: false,
      data: undefined,
      errorCode: 'E',
      errorMessage: 'bad',
    })
    const creator = await import('./reality/realityCreator')
    await expect(creator.createSpatialEntity({ name: 'n' })).rejects.toThrow(
      /createSpatialEntity failed/,
    )
  })
})

describe('SpatialEntity', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callJSB.mockImplementation((cmd: string) => {
      if (
        cmd === 'SetParentToEntity' ||
        cmd === 'UpdateEntityProperties' ||
        cmd === 'UpdateEntityEvent' ||
        cmd.startsWith('ConvertFrom')
      ) {
        return ok({})
      }
      return ok({ id: 'id-1' })
    })
  })

  it('manages parent-child relationships', async () => {
    const { SpatialEntity } = await import('./reality/entity/SpatialEntity')

    const parent = new SpatialEntity('p')
    const child = new SpatialEntity('c')
    await parent.addEntity(child)

    expect(parent.children.map(e => e.id)).toEqual(['c'])
    expect(child.parent).toBe(parent)

    await child.removeFromParent()
    expect(parent.children).toHaveLength(0)
    expect(child.parent).toBe(null)
  })

  it('updates transform state and calls JSB', async () => {
    const { SpatialEntity } = await import('./reality/entity/SpatialEntity')
    const e = new SpatialEntity('e')
    await e.updateTransform({ position: { x: 1, y: 2, z: 3 } })
    expect(e.position).toEqual({ x: 1, y: 2, z: 3 })
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateEntityProperties',
      expect.any(String),
    )
  })

  it('dispatches and bubbles events', async () => {
    const { SpatialEntity } = await import('./reality/entity/SpatialEntity')
    const parent = new SpatialEntity('p')
    const child = new SpatialEntity('c')
    parent.children.push(child)
    child.parent = parent

    const calls: string[] = []
    parent.events.spatialtap = () => calls.push('parent')
    child.events.spatialtap = () => calls.push('child')

    child.dispatchEvent(new CustomEvent('spatialtap', { bubbles: true }))
    expect(calls).toEqual(['child', 'parent'])
  })

  it('handles events from SpatialWebEvent injection', async () => {
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    const { SpatialEntity } = await import('./reality/entity/SpatialEntity')
    const { SpatialWebMsgType } = await import('./WebMsgCommand')

    SpatialWebEvent.init()
    const e = new SpatialEntity('e')
    const cb = vi.fn()
    e.events.spatialtap = cb
    window.__SpatialWebEvent({
      id: 'e',
      data: {
        type: SpatialWebMsgType.spatialtap,
        detail: { location3D: { x: 1, y: 2, z: 3 } },
      },
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('swallows updateEntityEvent failures in addEvent', async () => {
    const { SpatialEntity } = await import('./reality/entity/SpatialEntity')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    platformSpy.callJSB.mockImplementationOnce(() =>
      Promise.reject(new Error('x')),
    )

    const e = new SpatialEntity('e')
    await e.addEvent('spatialtap' as any, () => {})
    expect(Object.keys(e.events)).toHaveLength(0)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('SpatializedElement', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callJSB.mockImplementation((cmd: string) => {
      if (cmd === 'UpdateSpatializedElementTransform') return ok({})
      if (cmd === 'Destroy') return ok({})
      return ok({ id: 'id-1' })
    })
  })

  it('tracks gesture state and emits callbacks', async () => {
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    const { SpatialWebMsgType } = await import('./WebMsgCommand')
    const { SpatializedElement } = await import('./SpatializedElement')

    SpatialWebEvent.init()

    class TestElement extends SpatializedElement {
      updateProperties = vi.fn().mockResolvedValue({
        success: true,
        data: undefined,
        errorCode: '',
        errorMessage: '',
      })
    }

    const e = new TestElement('el')
    const dragStart = vi.fn()
    const drag = vi.fn()
    const dragEnd = vi.fn()
    e.onSpatialDragStart = dragStart
    e.onSpatialDrag = drag
    e.onSpatialDragEnd = dragEnd

    window.__SpatialWebEvent({
      id: 'el',
      data: {
        type: SpatialWebMsgType.spatialdrag,
        detail: {
          location3D: { x: 0, y: 0, z: 0 },
          startLocation3D: { x: 0, y: 0, z: 0 },
          translation3D: { x: 1, y: 0, z: 0 },
          predictedEndTranslation3D: { x: 0, y: 0, z: 0 },
          predictedEndLocation3D: { x: 0, y: 0, z: 0 },
          velocity: { width: 0, height: 0 },
        },
      },
    })
    window.__SpatialWebEvent({
      id: 'el',
      data: {
        type: SpatialWebMsgType.spatialdrag,
        detail: {
          location3D: { x: 0, y: 0, z: 0 },
          startLocation3D: { x: 0, y: 0, z: 0 },
          translation3D: { x: 1, y: 0, z: 0 },
          predictedEndTranslation3D: { x: 0, y: 0, z: 0 },
          predictedEndLocation3D: { x: 0, y: 0, z: 0 },
          velocity: { width: 0, height: 0 },
        },
      },
    })
    window.__SpatialWebEvent({
      id: 'el',
      data: {
        type: SpatialWebMsgType.spatialdragend,
        detail: {
          location3D: { x: 0, y: 0, z: 0 },
          startLocation3D: { x: 0, y: 0, z: 0 },
          translation3D: { x: 1, y: 0, z: 0 },
          predictedEndTranslation3D: { x: 0, y: 0, z: 0 },
          predictedEndLocation3D: { x: 0, y: 0, z: 0 },
          velocity: { width: 0, height: 0 },
        },
      },
    })

    expect(dragStart).toHaveBeenCalledTimes(1)
    expect(drag).toHaveBeenCalledTimes(2)
    expect(dragEnd).toHaveBeenCalledTimes(1)
  })

  it('handles transform and cubeInfo events and updates internal state', async () => {
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    const { SpatialWebMsgType } = await import('./WebMsgCommand')
    const { SpatializedElement } = await import('./SpatializedElement')

    SpatialWebEvent.init()

    class TestElement extends SpatializedElement {
      updateProperties = vi.fn().mockResolvedValue({
        success: true,
        data: undefined,
        errorCode: '',
        errorMessage: '',
      })
    }

    const e = new TestElement('el2')
    window.__SpatialWebEvent({
      id: 'el2',
      data: {
        type: SpatialWebMsgType.cubeInfo,
        size: { width: 1, height: 2, depth: 3 },
        origin: { x: 4, y: 5, z: 6 },
      },
    })
    expect(e.cubeInfo?.front).toBe(9)

    window.__SpatialWebEvent({
      id: 'el2',
      data: {
        type: SpatialWebMsgType.transform,
        detail: {
          column0: [1, 0, 0],
          column1: [0, 1, 0],
          column2: [0, 0, 1],
          column3: [10, 20, 30],
        },
      },
    })
    expect(e.transform).toBeDefined()
    expect(e.transformInv).toBeDefined()
  })

  it('updates flags via gesture handler setters and updates transform via JSB', async () => {
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    const { SpatializedElement } = await import('./SpatializedElement')

    SpatialWebEvent.init()

    class TestElement extends SpatializedElement {
      updateProperties = vi.fn().mockResolvedValue({
        success: true,
        data: undefined,
        errorCode: '',
        errorMessage: '',
      })
    }

    const e = new TestElement('el3')
    e.onSpatialTap = () => {}
    ;(e as any).onSpatialTap = undefined
    expect(e.updateProperties).toHaveBeenCalledWith({ enableTapGesture: true })
    expect(e.updateProperties).toHaveBeenCalledWith({ enableTapGesture: false })

    await e.updateTransform(new DOMMatrixPolyfill() as any)
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateSpatializedElementTransform',
      expect.any(String),
    )
  })

  it('removes event receiver on destroy', async () => {
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    const { SpatializedElement } = await import('./SpatializedElement')

    SpatialWebEvent.init()

    class TestElement extends SpatializedElement {
      updateProperties = vi.fn().mockResolvedValue({
        success: true,
        data: undefined,
        errorCode: '',
        errorMessage: '',
      })
    }

    const e = new TestElement('el4')
    expect(SpatialWebEvent.eventReceiver.el4).toBeDefined()
    await e.destroy()
    expect(SpatialWebEvent.eventReceiver.el4).toBeUndefined()
  })
})

describe('CubeInfo', () => {
  it('exposes derived bounds', async () => {
    const { CubeInfo } = await import('./types/types')
    const c = new CubeInfo(
      { width: 2, height: 3, depth: 4 },
      { x: 1, y: 2, z: 3 },
    )
    expect(c.left).toBe(1)
    expect(c.right).toBe(3)
    expect(c.bottom).toBe(5)
    expect(c.front).toBe(7)
  })
})
