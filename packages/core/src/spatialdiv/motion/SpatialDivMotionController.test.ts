import { describe, expect, test, vi } from 'vitest'
import { SpatialDivMotionController } from './SpatialDivMotionController'

describe('SpatialDivMotionController selective pause (Web)', () => {
  test('pause(["opacity"]) freezes opacity while translate continues', async () => {
    vi.useFakeTimers()

    const values: number[] = []
    const controller = new SpatialDivMotionController(
      {
        duration: 2,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            easing: 'linear',
            keyframes: [
              { at: 0, value: 0 },
              { at: 2, value: 100 },
            ],
          },
          {
            property: 'opacity',
            easing: 'linear',
            keyframes: [
              { at: 0, value: 0 },
              { at: 2, value: 1 },
            ],
          },
        ],
      },
      {
        onValuesChange: v => {
          if (v.opacity !== undefined) values.push(v.opacity)
        },
      },
    )

    controller.play()
    await vi.advanceTimersByTimeAsync(500)
    controller.pause('opacity')
    const frozenOpacity = values[values.length - 1]

    const lenAfterPause = values.length
    await vi.advanceTimersByTimeAsync(800)
    const opacityWhileFrozen = values[values.length - 1]

    expect(opacityWhileFrozen).toBe(frozenOpacity)
    expect(values.length).toBeGreaterThan(lenAfterPause)

    controller.destroy()
    vi.useRealTimers()
  })
})
