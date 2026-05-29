import { describe, expect, test } from 'vitest'
import {
  motionConfigToNativeSegment,
  motionConfigToNativeTimeline,
} from './nativeCompile'

describe('motionConfigToNativeSegment', () => {
  test('accepts simple two-keyframe timeline', () => {
    const seg = motionConfigToNativeSegment({
      duration: 0.8,
      tracks: [
        {
          property: 'opacity',
          timingFunction: 'easeOut',
          keyframes: [
            { at: 0, value: 0 },
            { at: 0.8, value: 1 },
          ],
        },
        {
          property: 'transform.translate.z',
          timingFunction: 'easeOut',
          keyframes: [
            { at: 0, value: 0 },
            { at: 0.8, value: 50 },
          ],
        },
      ],
    })
    expect(seg).not.toBeNull()
    expect(seg!.to.opacity).toBe(1)
    expect(seg!.to.transform?.translate?.z).toBe(50)
  })

  test('rejects multi-track overlap timeline', () => {
    const seg = motionConfigToNativeSegment({
      duration: 5,
      tracks: [
        {
          property: 'transform.translate.x',
          timingFunction: 'linear',
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
    expect(seg).toBeNull()
  })
})

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
