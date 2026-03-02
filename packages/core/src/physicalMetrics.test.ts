import { describe, expect, test, vi } from 'vitest'

async function loadModule() {
  vi.resetModules()
  return await import('./physicalMetrics')
}

describe('physicalMetrics', () => {
  test('default scaled conversion', async () => {
    const { point2physical, physical2point, getValue } = await loadModule()
    const v = getValue()
    expect(v.meterToPtScaled).toBe(1360)
    expect(v.meterToPtUnscaled).toBe(1360)
    expect(point2physical(1360)).toBe(1)
    expect(physical2point(1)).toBe(1360)
  })

  test('unscaled compensation uses unscaled metrics', async () => {
    const { point2physical, physical2point } = await loadModule()
    expect(point2physical(1360, { worldScalingCompensation: 'unscaled' })).toBe(
      1,
    )
    expect(physical2point(1, { worldScalingCompensation: 'unscaled' })).toBe(
      1360,
    )
  })

  test('updateValue applies window metrics', async () => {
    const m = await loadModule()
    ;(window as any).__physicalMetrics = {
      meterToPtScaled: 2000,
      meterToPtUnscaled: 1500,
    }
    const unsubscribe = m.subscribe(() => {})
    window.dispatchEvent(new Event('physicalMetricsUpdate'))
    const v = m.getValue()
    expect(v.meterToPtScaled).toBe(2000)
    expect(v.meterToPtUnscaled).toBe(1500)
    expect(m.point2physical(2000)).toBe(1)
    expect(
      m.point2physical(1500, { worldScalingCompensation: 'unscaled' }),
    ).toBe(1)
    unsubscribe()
    ;(window as any).__physicalMetrics = undefined
  })

  test('updateValue applies partial metrics', async () => {
    const m = await loadModule()
    ;(window as any).__physicalMetrics = { meterToPtScaled: 1000 }
    const unsubscribe = m.subscribe(() => {})
    window.dispatchEvent(new Event('physicalMetricsUpdate'))
    expect(m.getValue().meterToPtScaled).toBe(1000)
    expect(m.getValue().meterToPtUnscaled).toBe(1360)
    expect(m.point2physical(1000)).toBe(1)
    expect(m.physical2point(1, { worldScalingCompensation: 'unscaled' })).toBe(
      1360,
    )
    unsubscribe()
    ;(window as any).__physicalMetrics = undefined
  })

  test('subscribe listens to event and supports unsubscribe', async () => {
    const m = await loadModule()
    const cb = vi.fn()
    const unsubscribe = m.subscribe(cb)
    ;(window as any).__physicalMetrics = {
      meterToPtScaled: 900,
      meterToPtUnscaled: 800,
    }
    window.dispatchEvent(new Event('physicalMetricsUpdate'))
    expect(cb).toHaveBeenCalledTimes(1)
    expect(m.getValue().meterToPtScaled).toBe(900)
    expect(m.getValue().meterToPtUnscaled).toBe(800)
    ;(window as any).__physicalMetrics = {
      meterToPtScaled: 700,
      meterToPtUnscaled: 600,
    }
    window.dispatchEvent(new Event('physicalMetricsUpdate'))
    expect(cb).toHaveBeenCalledTimes(2)
    expect(m.getValue().meterToPtScaled).toBe(700)
    expect(m.getValue().meterToPtUnscaled).toBe(600)

    unsubscribe()
    ;(window as any).__physicalMetrics = {
      meterToPtScaled: 500,
      meterToPtUnscaled: 400,
    }
    window.dispatchEvent(new Event('physicalMetricsUpdate'))
    expect(cb).toHaveBeenCalledTimes(2)
    expect(m.getValue().meterToPtScaled).toBe(500)
    expect(m.getValue().meterToPtUnscaled).toBe(400)
    ;(window as any).__physicalMetrics = undefined
  })
})
