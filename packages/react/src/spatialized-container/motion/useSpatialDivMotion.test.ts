import { describe, expect, test } from 'vitest'
import { evaluateMotionTimeline } from './evaluate'
import { desugarTimelineConfig, segmentConfigToMotionConfig } from './simple'
import { valuesToMotionStyle } from './style'
import { validateSpatializedMotionConfig } from './validate'

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
        timingFunction: 'linear' as const,
      },
      {
        property: 'opacity' as const,
        keyframes: [
          { at: 3, value: 0 },
          { at: 5, value: 1 },
        ],
        timingFunction: 'linear' as const,
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
          timingFunction: 'linear' as const,
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
          timingFunction: 'linear' as const,
        },
        {
          property: 'transform.rotate.z' as const,
          keyframes: [
            { at: 1, value: 0 },
            { at: 4, value: 180 },
          ],
          timingFunction: 'linear' as const,
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

describe('timeline config parsing and timingFunction cascade', () => {
  test('timeline parsing handles decimal percentages and missing properties', () => {
    const normalized = desugarTimelineConfig({
      duration: 10,
      timeline: {
        '0%': { opacity: 0, transform: { translate: { x: 0 } } },
        '30.33%': { opacity: 0.5 },
        '100%': { opacity: 1, transform: { translate: { x: 100 } } },
      },
    })
    expect(normalized.tracks).toHaveLength(2)

    const opacityTrack = normalized.tracks.find(
      track => track.property === 'opacity',
    )
    expect(opacityTrack?.keyframes).toHaveLength(3)
    expect(opacityTrack?.keyframes[0]).toMatchObject({ at: 0, value: 0 })
    expect(opacityTrack?.keyframes[1].at).toBeCloseTo(3.033, 3)
    expect(opacityTrack?.keyframes[1]).toMatchObject({ value: 0.5 })
    expect(opacityTrack?.keyframes[2]).toMatchObject({ at: 10, value: 1 })

    const translateXTrack = normalized.tracks.find(
      track => track.property === 'transform.translate.x',
    )
    expect(translateXTrack?.keyframes).toHaveLength(2)
    expect(translateXTrack?.keyframes[0]).toMatchObject({ at: 0, value: 0 })
    expect(translateXTrack?.keyframes[1]).toMatchObject({ at: 10, value: 100 })
  })

  test('validate rejects single-frame timeline', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: {
          '50%': { opacity: 1 },
        },
      } as any),
    ).toThrow(/at least 2 percentage keys/)
  })

  test('timingFunction cascade prefers keyframe over track over config over linear', () => {
    const values = evaluateMotionTimeline(
      {
        duration: 1,
        timingFunction: 'easeInOut',
        tracks: [
          {
            property: 'opacity',
            timingFunction: 'easeOut',
            keyframes: [
              { at: 0, value: 0, timingFunction: 'linear' },
              { at: 1, value: 100 },
            ],
          },
          {
            property: 'transform.translate.x',
            timingFunction: 'linear',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 100 },
            ],
          },
          {
            property: 'transform.translate.y',
            timingFunction: 'easeOut',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 100 },
            ],
          },
          {
            property: 'transform.translate.z',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 100 },
            ],
          },
        ],
      },
      0.5,
    )

    expect(values.opacity).toBe(50)
    expect(values.transform?.translate?.x).toBe(50)
    expect(values.transform?.translate?.y).toBeGreaterThan(50)
    expect(values.transform?.translate?.z).toBe(50)
  })
})

describe('validateSpatializedMotionConfig', () => {
  test('rejects duplicate property tracks', () => {
    expect(() =>
      validateSpatializedMotionConfig({
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
