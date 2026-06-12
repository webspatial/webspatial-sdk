import { describe, expect, test } from 'vitest'
import { motionConfigToNativeTimeline } from '../native/serializeMotionTimeline'

describe('motionConfigToNativeTimeline', () => {
  test('builds timeline payload for multi-track', () => {
    const tl = motionConfigToNativeTimeline({
      duration: 5,
      tracks: [
        {
          property: 'transform.translate.x',
          keyframes: [
            { at: 0, value: 0 },
            { at: 5, value: 100 },
          ],
        },
        {
          property: 'opacity',
          timingFunction: 'easeOut',
          keyframes: [
            { at: 3, value: 0 },
            { at: 5, value: 1 },
          ],
        },
      ],
    })
    expect(tl.duration).toBe(5)
    expect(tl.tracks).toHaveLength(2)
    expect(tl.tracks[1].timingFunction).toBe('easeOut')
  })

  test('serializes keyframe and config timingFunction propagation', () => {
    const tl = motionConfigToNativeTimeline({
      duration: 4,
      timingFunction: 'easeInOut',
      tracks: [
        {
          property: 'transform.translate.x',
          keyframes: [
            { at: 0, value: 0, timingFunction: 'easeOut' },
            { at: 2, value: 100 },
            { at: 4, value: 200 },
          ],
        },
        {
          property: 'opacity',
          keyframes: [
            { at: 0, value: 0 },
            { at: 4, value: 1 },
          ],
        },
      ],
    })

    expect(tl.tracks[0].keyframes[0]).toMatchObject({
      at: 0,
      value: 0,
      timingFunction: 'easeOut',
    })
    expect(tl.tracks[1].timingFunction).toBe('easeInOut')
  })
})
