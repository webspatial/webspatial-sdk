import { describe, expect, test } from 'vitest'
import {
  validateNormalizedMotionConfig,
  validateSpatializedMotionConfig,
} from './validate'

describe('validateNormalizedMotionConfig', () => {
  test('accepts a canonical track-based motion config', () => {
    expect(() =>
      validateNormalizedMotionConfig({
        duration: 1,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 10 },
            ],
          },
        ],
      }),
    ).not.toThrow()
  })

  test('accepts opacity tracks', () => {
    expect(() =>
      validateNormalizedMotionConfig({
        duration: 1,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 1 },
            ],
          },
        ],
      }),
    ).not.toThrow()
  })
})

describe('validateSpatializedMotionConfig', () => {
  test('accepts complete top-level segment authoring', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    ).not.toThrow()
  })

  test.each([{ to: { opacity: 1 } }, { from: { opacity: 0 } }])(
    'rejects incomplete top-level segment authoring',
    config => {
      expect(() => validateSpatializedMotionConfig(config as never)).toThrow(
        /top-level from and to are both required/,
      )
    },
  )

  test('accepts a timeline without top-level boundaries', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: {
          from: { opacity: 0 },
          '50%': { opacity: 0.5 },
          to: { opacity: 1 },
        },
      }),
    ).not.toThrow()
  })

  test('accepts decimal spellings of percentage boundaries', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: {
          '0.0%': { opacity: 0 },
          '100.0%': { opacity: 1 },
        },
      }),
    ).not.toThrow()
  })

  test('ignores top-level boundaries when timeline is present', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        from: { opacity: Number.NaN },
        to: { opacity: Number.NaN },
        timeline: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      }),
    ).not.toThrow()
  })

  test.each([
    {
      duration: 1,
      timeline: { '50%': { opacity: 0.5 }, to: { opacity: 1 } },
    },
    {
      duration: 1,
      timeline: { from: { opacity: 0 }, '50%': { opacity: 0.5 } },
    },
  ])('accepts sparse property boundaries', config => {
    expect(() => validateSpatializedMotionConfig(config as never)).not.toThrow()
  })

  test('rejects a property with only one keyframe', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: { '50%': { opacity: 0.5 } },
      }),
    ).toThrow(/track "opacity" needs at least 2 keyframes/)
  })

  test.each([
    {
      duration: 1,
      timeline: {
        from: { opacity: 0 },
        '0%': { opacity: 0 },
        to: { opacity: 1 },
      },
      expected: /duplicate start boundary.*opacity/,
    },
    {
      duration: 1,
      timeline: {
        from: { opacity: 0 },
        to: { opacity: 1 },
        '100%': { opacity: 1 },
      },
      expected: /duplicate end boundary.*opacity/,
    },
  ])('rejects duplicate property boundaries', config => {
    expect(() => validateSpatializedMotionConfig(config as never)).toThrow(
      config.expected,
    )
  })

  test('rejects public tracks authoring', () => {
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
        ],
      } as never),
    ).toThrow(/tracks authoring is internal/)
  })
})
