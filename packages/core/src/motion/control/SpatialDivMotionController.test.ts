import { describe, expect, test, vi } from 'vitest'
import { SpatializedMotionController } from './SpatializedMotionController'

describe('SpatializedMotionController (spatialized2d) selective pause (Web)', () => {
  test('pause(["opacity"]) freezes opacity while translate continues', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback): number =>
        setTimeout(() => cb(performance.now()), 16) as unknown as number,
    )
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      clearTimeout(id)
    })

    const values: number[] = []
    const controller = new SpatializedMotionController(
      {
        duration: 2,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            timingFunction: 'linear',
            keyframes: [
              { at: 0, value: 0 },
              { at: 2, value: 100 },
            ],
          },
          {
            property: 'opacity',
            timingFunction: 'linear',
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
    controller.attachElement(null, 'spatialized2d')

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
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
})
