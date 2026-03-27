import { describe, expect, test, vi } from 'vitest'

async function loadModule() {
  vi.resetModules()
  return await import('./physicalMetrics')
}

describe('physicalMetrics', () => {
  test('default scaled conversion', async () => {
    const { pointToPhysical, physicalToPoint, getValue } = await loadModule()
    const v = getValue()
    expect(v.meterToPtScaled).toBe(1360)
    expect(v.meterToPtUnscaled).toBe(1360)
    expect(pointToPhysical(1360)).toBe(1)
    expect(physicalToPoint(1)).toBe(1360)
  })

  test('unscaled compensation uses unscaled metrics', async () => {
    const { pointToPhysical, physicalToPoint } = await loadModule()
    expect(
      pointToPhysical(1360, { worldScalingCompensation: 'unscaled' }),
    ).toBe(1)
    expect(physicalToPoint(1, { worldScalingCompensation: 'unscaled' })).toBe(
      1360,
    )
  })

  test('updateValue applies window metrics', async () => {
    const m = await loadModule()
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    SpatialWebEvent.init()
    ;(window as any).__webspatialsdk__ = {
      physicalMetrics: {
        meterToPtScaled: 2000,
        meterToPtUnscaled: 1500,
      },
    }
    const unsubscribe = m.subscribe(() => {})
    window.__SpatialWebEvent({ id: 'window', data: {} })
    const v = m.getValue()
    expect(v.meterToPtScaled).toBe(2000)
    expect(v.meterToPtUnscaled).toBe(1500)
    expect(m.pointToPhysical(2000)).toBe(1)
    expect(
      m.pointToPhysical(1500, { worldScalingCompensation: 'unscaled' }),
    ).toBe(1)
    unsubscribe()
    ;(window as any).__webspatialsdk__ = undefined
  })

  test('updateValue applies partial metrics', async () => {
    const m = await loadModule()
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    SpatialWebEvent.init()
    ;(window as any).__webspatialsdk__ = {
      physicalMetrics: { meterToPtScaled: 1000 },
    }
    const unsubscribe = m.subscribe(() => {})
    window.__SpatialWebEvent({ id: 'window', data: {} })
    expect(m.getValue().meterToPtScaled).toBe(1000)
    expect(m.getValue().meterToPtUnscaled).toBe(1360)
    expect(m.pointToPhysical(1000)).toBe(1)
    expect(m.physicalToPoint(1, { worldScalingCompensation: 'unscaled' })).toBe(
      1360,
    )
    unsubscribe()
    ;(window as any).__webspatialsdk__ = undefined
  })

  test('subscribe listens to event and supports unsubscribe', async () => {
    const m = await loadModule()
    const { SpatialWebEvent } = await import('./SpatialWebEvent')
    SpatialWebEvent.init()
    const cb = vi.fn()
    const unsubscribe = m.subscribe(cb)
    ;(window as any).__webspatialsdk__ = {
      physicalMetrics: {
        meterToPtScaled: 900,
        meterToPtUnscaled: 800,
      },
    }
    window.__SpatialWebEvent({ id: 'window', data: {} })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(m.getValue().meterToPtScaled).toBe(900)
    expect(m.getValue().meterToPtUnscaled).toBe(800)
    ;(window as any).__webspatialsdk__ = {
      physicalMetrics: {
        meterToPtScaled: 700,
        meterToPtUnscaled: 600,
      },
    }
    window.__SpatialWebEvent({ id: 'window', data: {} })
    expect(cb).toHaveBeenCalledTimes(2)
    expect(m.getValue().meterToPtScaled).toBe(700)
    expect(m.getValue().meterToPtUnscaled).toBe(600)

    unsubscribe()
    ;(window as any).__webspatialsdk__ = {
      physicalMetrics: {
        meterToPtScaled: 500,
        meterToPtUnscaled: 400,
      },
    }
    window.__SpatialWebEvent({ id: 'window', data: {} })
    expect(cb).toHaveBeenCalledTimes(2)
    expect(m.getValue().meterToPtScaled).toBe(500)
    expect(m.getValue().meterToPtUnscaled).toBe(400)
    ;(window as any).__webspatialsdk__ = undefined
  })
})
