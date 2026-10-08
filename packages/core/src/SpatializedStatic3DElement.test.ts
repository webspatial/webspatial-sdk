import { afterEach, describe, expect, it, vi } from 'vitest'
import { SpatialWebMsgType } from './WebMsgCommand'
import { SpatializedStatic3DElement } from './SpatializedStatic3DElement'

// Single mock for the native bridge layer — everything else runs as-is
vi.mock('./JSBCommand', () => {
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

  return { UpdateSpatializedStatic3DElementProperties: OkCommand }
})

describe('SpatializedStatic3DElement', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ready starts as a pending promise', () => {
    const el = new SpatializedStatic3DElement('s1', 'model.glb')
    expect(el.ready).toBeInstanceOf(Promise)
  })

  it('ready resolves to true on modelloaded event', async () => {
    const el = new SpatializedStatic3DElement('s2', 'model.glb')
    const p = el.ready

    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: { src: 'https://example.com/model.glb' },
    })
    await expect(p).resolves.toBe(true)
  })

  it('sets currentSrc from modelloaded detail data', () => {
    const el = new SpatializedStatic3DElement('s2b', 'model.glb')

    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: { src: 'https://cdn.example.com/fallback.usdz' },
    })

    expect(el.currentSrc).toBe('https://cdn.example.com/fallback.usdz')
  })

  it('defaults bounding box properties to zero before the model loads', () => {
    const el = new SpatializedStatic3DElement('bounds-default', 'model.glb')

    expect(el.boundingBoxCenter).toMatchObject({ x: 0, y: 0, z: 0 })
    expect(el.boundingBoxExtents).toMatchObject({ x: 0, y: 0, z: 0 })
  })

  it('sets bounding box properties from modelloaded detail data', () => {
    const el = new SpatializedStatic3DElement('bounds-loaded', 'model.glb')

    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: {
        src: 'https://example.com/model.glb',
        boundingBoxCenter: { x: 1, y: 2, z: 3 },
        boundingBoxExtents: { x: 4, y: 5, z: 6 },
      },
    })

    expect(el.boundingBoxCenter).toBeInstanceOf(DOMPointReadOnly)
    expect(el.boundingBoxCenter).toMatchObject({ x: 1, y: 2, z: 3 })
    expect(el.boundingBoxExtents).toBeInstanceOf(DOMPointReadOnly)
    expect(el.boundingBoxExtents).toMatchObject({ x: 4, y: 5, z: 6 })
  })

  it('keeps bounding box properties compatible with older runtimes', () => {
    const el = new SpatializedStatic3DElement('bounds-legacy', 'model.glb')

    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: { src: 'https://example.com/model.glb' },
    })

    expect(el.boundingBoxCenter).toMatchObject({ x: 0, y: 0, z: 0 })
    expect(el.boundingBoxExtents).toMatchObject({ x: 0, y: 0, z: 0 })
  })

  it('resets bounding box properties when the model source changes', async () => {
    const el = new SpatializedStatic3DElement('bounds-reset', 'model.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: {
        src: 'model.glb',
        boundingBoxCenter: { x: 1, y: 2, z: 3 },
        boundingBoxExtents: { x: 4, y: 5, z: 6 },
      },
    })

    await el.updateProperties({ modelURL: 'replacement.glb' })

    expect(el.boundingBoxCenter).toMatchObject({ x: 0, y: 0, z: 0 })
    expect(el.boundingBoxExtents).toMatchObject({ x: 0, y: 0, z: 0 })
  })

  it('makes bounds available inside onLoad and after ready resolves', async () => {
    const el = new SpatializedStatic3DElement('bounds-ready', 'model.glb')
    const onLoad = vi.fn(() => {
      expect(el.boundingBoxCenter).toMatchObject({ x: -1, y: 0.5, z: 2 })
      expect(el.boundingBoxExtents).toMatchObject({ x: 0.2, y: 0.4, z: 0.6 })
    })
    el.onLoadCallback = onLoad

    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: {
        src: 'model.glb',
        boundingBoxCenter: { x: -1, y: 0.5, z: 2 },
        boundingBoxExtents: { x: 0.2, y: 0.4, z: 0.6 },
      },
    })

    expect(onLoad).toHaveBeenCalledOnce()
    await expect(el.ready).resolves.toBe(true)
    expect(el.boundingBoxCenter).toMatchObject({ x: -1, y: 0.5, z: 2 })
    expect(el.boundingBoxExtents).toMatchObject({ x: 0.2, y: 0.4, z: 0.6 })
  })

  it('keeps cached bounds static through transform and animation changes', async () => {
    const el = new SpatializedStatic3DElement('bounds-static', 'model.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: {
        src: 'model.glb',
        boundingBoxCenter: { x: 1, y: 2, z: 3 },
        boundingBoxExtents: { x: 4, y: 5, z: 6 },
      },
    })
    const center = el.boundingBoxCenter
    const extents = el.boundingBoxExtents
    const transform = new DOMMatrix().translate(10, 20, 30).rotate(45).scale(2)

    el.entityTransform = transform
    el.onReceiveEvent({
      type: SpatialWebMsgType.entitytransformchange,
      detail: { transform: Array.from(transform.toFloat64Array()) },
    })
    el.onReceiveEvent({
      type: SpatialWebMsgType.animationstatechange,
      detail: { paused: false, duration: 10, currentTime: 5 },
    })
    await el.updateProperties({ modelURL: 'model.glb', loop: true })

    expect(el.boundingBoxCenter).toBe(center)
    expect(el.boundingBoxExtents).toBe(extents)
    expect(center).toMatchObject({ x: 1, y: 2, z: 3 })
    expect(extents).toMatchObject({ x: 4, y: 5, z: 6 })
    expect(Reflect.set(el, 'boundingBoxCenter', new DOMPointReadOnly())).toBe(
      false,
    )
    expect(Reflect.set(el, 'boundingBoxExtents', new DOMPointReadOnly())).toBe(
      false,
    )
  })

  it('resets bounds for replacement sources and accepts a legacy load message', async () => {
    const sources = [{ src: 'model.glb', type: 'model/gltf-binary' }]
    const el = new SpatializedStatic3DElement(
      'bounds-sources',
      undefined,
      sources,
    )
    el.onReceiveEvent({
      type: SpatialWebMsgType.modelloaded,
      detail: {
        src: 'model.glb',
        boundingBoxCenter: { x: 1, y: 2, z: 3 },
        boundingBoxExtents: { x: 4, y: 5, z: 6 },
      },
    })
    const center = el.boundingBoxCenter
    const extents = el.boundingBoxExtents

    await el.updateProperties({ sources: [...sources] })
    expect(el.boundingBoxCenter).toBe(center)
    expect(el.boundingBoxExtents).toBe(extents)

    await el.updateProperties({ sources: [{ src: 'replacement.usdz' }] })
    expect(el.boundingBoxCenter).toBeInstanceOf(DOMPointReadOnly)
    expect(el.boundingBoxExtents).toBeInstanceOf(DOMPointReadOnly)
    expect(el.boundingBoxCenter).toMatchObject({ x: 0, y: 0, z: 0 })
    expect(el.boundingBoxExtents).toMatchObject({ x: 0, y: 0, z: 0 })

    el.onReceiveEvent({ type: SpatialWebMsgType.modelloaded })
    await expect(el.ready).resolves.toBe(true)
    expect(el.boundingBoxCenter).toMatchObject({ x: 0, y: 0, z: 0 })
    expect(el.boundingBoxExtents).toMatchObject({ x: 0, y: 0, z: 0 })
  })

  it('ready resolves to false on modelloadfailed event', async () => {
    const el = new SpatializedStatic3DElement('s3', 'model.glb')
    const p = el.ready

    el.onReceiveEvent({ type: SpatialWebMsgType.modelloadfailed })
    await expect(p).resolves.toBe(false)
  })

  it('fires onLoadCallback on modelloaded', () => {
    const el = new SpatializedStatic3DElement('s4', 'model.glb')
    const cb = vi.fn()
    el.onLoadCallback = cb

    el.onReceiveEvent({ type: SpatialWebMsgType.modelloaded })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('fires onLoadFailureCallback on modelloadfailed', () => {
    const el = new SpatializedStatic3DElement('s5', 'model.glb')
    const cb = vi.fn()
    el.onLoadFailureCallback = cb

    el.onReceiveEvent({ type: SpatialWebMsgType.modelloadfailed })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not fire callbacks when they are not set', () => {
    const el = new SpatializedStatic3DElement('s6', 'model.glb')
    // Should not throw when no callbacks are registered
    expect(() =>
      el.onReceiveEvent({ type: SpatialWebMsgType.modelloaded }),
    ).not.toThrow()
    expect(() =>
      el.onReceiveEvent({ type: SpatialWebMsgType.modelloadfailed }),
    ).not.toThrow()
  })

  it('resets ready when modelURL changes', async () => {
    const el = new SpatializedStatic3DElement('s7', 'a.glb')
    const first = el.ready

    await el.updateProperties({ modelURL: 'b.glb' })
    expect(el.ready).not.toBe(first)
  })

  it('does not reset ready when modelURL stays the same', async () => {
    const el = new SpatializedStatic3DElement('s8', 'a.glb')
    const first = el.ready

    await el.updateProperties({ modelURL: 'a.glb' })
    expect(el.ready).toBe(first)
  })

  it('cancels old ready promise with false when modelURL changes', async () => {
    const el = new SpatializedStatic3DElement('s9', 'a.glb')
    const first = el.ready

    await el.updateProperties({ modelURL: 'b.glb' })
    await expect(first).resolves.toBe(false)
  })

  it('new ready promise works after URL change', async () => {
    const el = new SpatializedStatic3DElement('s10', 'a.glb')

    await el.updateProperties({ modelURL: 'b.glb' })
    const second = el.ready

    el.onReceiveEvent({ type: SpatialWebMsgType.modelloaded })
    await expect(second).resolves.toBe(true)
  })

  it('handles multiple URL changes in sequence', async () => {
    const el = new SpatializedStatic3DElement('s11', 'a.glb')
    const p1 = el.ready

    await el.updateProperties({ modelURL: 'b.glb' })
    await expect(p1).resolves.toBe(false)

    const p2 = el.ready
    await el.updateProperties({ modelURL: 'c.glb' })
    await expect(p2).resolves.toBe(false)

    const p3 = el.ready
    el.onReceiveEvent({ type: SpatialWebMsgType.modelloaded })
    await expect(p3).resolves.toBe(true)
  })

  it('currentTime defaults to 0 before any sample', () => {
    const el = new SpatializedStatic3DElement('ct1', 'a.glb')
    expect(el.currentTime).toBe(0)
  })

  it('currentTime returns the anchor while paused', () => {
    const el = new SpatializedStatic3DElement('ct2', 'a.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.animationstatechange,
      detail: {
        paused: true,
        duration: 10,
        currentTime: 4,
        timestamp: Date.now(),
      },
    })
    expect(el.currentTime).toBe(4)
  })

  it('currentTime extrapolates while playing using playbackRate', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000)
    const el = new SpatializedStatic3DElement('ct3', 'a.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.animationstatechange,
      detail: {
        paused: false,
        duration: 10,
        currentTime: 2,
        timestamp: 1_000,
      },
    })
    nowSpy.mockReturnValue(2_000) // +1s real time
    // default rate 1 → +1s animation time
    expect(el.currentTime).toBe(3)
    nowSpy.mockRestore()
  })

  it('currentTime clamps extrapolation to duration', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000)
    const el = new SpatializedStatic3DElement('ct4', 'a.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.animationstatechange,
      detail: {
        paused: false,
        duration: 5,
        currentTime: 4,
        timestamp: 1_000,
      },
    })
    nowSpy.mockReturnValue(11_000) // +10s real time → would extrapolate to 14
    expect(el.currentTime).toBe(5)
    nowSpy.mockRestore()
  })

  it('setting currentTime optimistically updates the anchor', async () => {
    const el = new SpatializedStatic3DElement('ct5', 'a.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.animationstatechange,
      detail: {
        paused: true,
        duration: 10,
        currentTime: 0,
        timestamp: Date.now(),
      },
    })
    el.currentTime = 7
    expect(el.currentTime).toBe(7)
  })

  it('setting currentTime clamps negative values to 0', async () => {
    const el = new SpatializedStatic3DElement('ct6', 'a.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.animationstatechange,
      detail: {
        paused: true,
        duration: 10,
        currentTime: 5,
        timestamp: Date.now(),
      },
    })
    el.currentTime = -3
    expect(el.currentTime).toBe(0)
  })

  it('setting currentTime clamps values above duration', async () => {
    const el = new SpatializedStatic3DElement('ct7', 'a.glb')
    el.onReceiveEvent({
      type: SpatialWebMsgType.animationstatechange,
      detail: {
        paused: true,
        duration: 8,
        currentTime: 0,
        timestamp: Date.now(),
      },
    })
    el.currentTime = 100
    expect(el.currentTime).toBe(8)
  })
})
