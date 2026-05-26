import { describe, expect, test } from 'vitest'
import { evaluateMotionTimeline } from './evaluate'
import { segmentConfigToMotionConfig } from './simple'
import { valuesToMotionStyle } from './style'
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

  test('translate.z linear sample at midpoint and end', () => {
    const depthTrack = {
      duration: 4,
      tracks: [
        {
          property: 'transform.translate.z' as const,
          keyframes: [
            { at: 0, value: 0 },
            { at: 4, value: -120 },
          ],
          easing: 'linear' as const,
        },
      ],
    }
    const mid = evaluateMotionTimeline(depthTrack, 2)
    expect(mid.transform?.translate?.z).toBe(-60)
    const end = evaluateMotionTimeline(depthTrack, 4)
    expect(end.transform?.translate?.z).toBe(-120)
  })

  test('rotate.y and rotate.z samples with staggered keyframes', () => {
    const rotateTrack = {
      duration: 4,
      tracks: [
        {
          property: 'transform.rotate.y' as const,
          keyframes: [
            { at: 0, value: 0 },
            { at: 4, value: 90 },
          ],
          easing: 'linear' as const,
        },
        {
          property: 'transform.rotate.z' as const,
          keyframes: [
            { at: 1, value: 0 },
            { at: 4, value: 180 },
          ],
          easing: 'linear' as const,
        },
      ],
    }
    const t2 = evaluateMotionTimeline(rotateTrack, 2)
    expect(t2.transform?.rotate?.y).toBe(45)
    expect(t2.transform?.rotate?.z).toBe(60)

    const t3 = evaluateMotionTimeline(rotateTrack, 3)
    expect(t3.transform?.rotate?.y).toBeCloseTo(67.5, 5)
    expect(t3.transform?.rotate?.z).toBe(120)
  })
})

describe('valuesToMotionStyle', () => {
  test('composes translate.z and rotate axes into CSS transform string', () => {
    const style = valuesToMotionStyle({
      transform: {
        translate: { z: -40 },
        rotate: { y: 30, z: 15 },
      },
    })
    const tx = String(style.transform)
    expect(tx).toContain('translate3d(0px, 0px, -40px)')
    expect(tx).toContain('rotateY(30deg)')
    expect(tx).toContain('rotateZ(15deg)')
  })
})

describe('segmentConfigToMotionConfig', () => {
  test('builds tracks from from/to', () => {
    const cfg = segmentConfigToMotionConfig({
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
