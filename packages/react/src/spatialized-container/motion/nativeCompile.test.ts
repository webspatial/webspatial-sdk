import { describe, expect, test } from 'vitest'
import { motionConfigToNativeTimeline } from './nativeCompile'

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

  test('builds timeline with translate.z and rotate tracks', () => {
    const tl = motionConfigToNativeTimeline({
      duration: 4,
      tracks: [
        {
          property: 'transform.translate.z',
          keyframes: [
            { at: 0, value: 0 },
            { at: 4, value: -120 },
          ],
          timingFunction: 'easeInOut',
        },
        {
          property: 'transform.rotate.y',
          keyframes: [
            { at: 0, value: 0 },
            { at: 4, value: 90 },
          ],
        },
        {
          property: 'transform.rotate.z',
          keyframes: [
            { at: 1, value: 0 },
            { at: 4, value: 180 },
          ],
          timingFunction: 'linear',
        },
      ],
    })
    expect(tl.tracks).toHaveLength(3)
    expect(tl.tracks.map(t => t.property)).toEqual([
      'transform.translate.z',
      'transform.rotate.y',
      'transform.rotate.z',
    ])
  })
})
