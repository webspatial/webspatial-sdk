import { describe, expect, test, vi } from 'vitest'
import { SpatializedMotionController } from './SpatializedMotionController'

describe('SpatializedMotionController (spatialized2d) whole pause/resume (Web)', () => {
  test('pause() freezes the whole controller and resume() continues it', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback): number =>
        setTimeout(() => cb(performance.now()), 16) as unknown as number,
    )
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      clearTimeout(id)
    })

    try {
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
      controller.pause()
      const pausedOpacity = values[values.length - 1]
      const lenAfterPause = values.length

      await vi.advanceTimersByTimeAsync(800)
      expect(values[values.length - 1]).toBe(pausedOpacity)
      expect(values.length).toBe(lenAfterPause)

      controller.resume()
      await vi.advanceTimersByTimeAsync(400)
      expect(values.length).toBeGreaterThan(lenAfterPause)
      expect(controller.isPaused).toBe(false)

      if (false) {
        // @ts-expect-error pause() no longer accepts keys
        controller.pause('opacity')
        // @ts-expect-error resume() no longer accepts keys
        controller.resume(['opacity'])
      }

      controller.destroy()
    } finally {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    }
  })
})
