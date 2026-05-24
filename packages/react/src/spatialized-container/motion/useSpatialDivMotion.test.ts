import { describe, expect, test } from 'vitest'
import { evaluateMotionTimeline } from './evaluate'
import { simpleConfigToMotionConfig } from './simple'
import { validateSpatialDivMotionConfig } from './validate'

describe('evaluateMotionTimeline', () => {
  const multiTrack = {
    duration: 5,
    tracks: [
      {
        property: 'transform.translate.x' as const,
        keyframes: [
          { at: 0, value: 0 },
          { at: 5, value: 100 },
        ],
        easing: 'linear' as const,
      },
      {
        property: 'opacity' as const,
        keyframes: [
          { at: 3, value: 0 },
          { at: 5, value: 1 },
        ],
        easing: 'linear' as const,
      },
    ],
  }

  test('canonical overlap: t=1.5 translate mid, opacity held at 0', () => {
    const v = evaluateMotionTimeline(multiTrack, 1.5)
    expect(v.transform?.translate?.x).toBe(30)
    expect(v.opacity).toBe(0)
  })

  test('canonical overlap: t=5 terminal values', () => {
    const v = evaluateMotionTimeline(multiTrack, 5)
    expect(v.transform?.translate?.x).toBe(100)
    expect(v.opacity).toBe(1)
  })

  test('opacity holds first keyframe before at=3', () => {
    const v = evaluateMotionTimeline(multiTrack, 0.5)
    expect(v.opacity).toBe(0)
  })
})

describe('simpleConfigToMotionConfig', () => {
  test('builds tracks from from/to', () => {
    const cfg = simpleConfigToMotionConfig({
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: 0.6,
    })
    expect(cfg.duration).toBe(0.6)
    expect(cfg.tracks).toHaveLength(1)
    expect(cfg.tracks[0].keyframes).toEqual([
      { at: 0, value: 0 },
      { at: 0.6, value: 1 },
    ])
  })
})

describe('validateSpatialDivMotionConfig', () => {
  test('rejects duplicate property tracks', () => {
    expect(() =>
      validateSpatialDivMotionConfig({
        duration: 1,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 1 },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { at: 0, value: 0.5 },
              { at: 1, value: 1 },
            ],
          },
        ],
      }),
    ).toThrow(/duplicate track/)
  })
})
