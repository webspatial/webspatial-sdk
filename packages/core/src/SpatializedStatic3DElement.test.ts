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
})
