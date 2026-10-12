import { describe, expect, test, vi } from 'vitest'
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

  test('rejects a timeline missing the start frame', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: { '50%': { opacity: 0.5 }, to: { opacity: 1 } },
      }),
    ).toThrow(/must define a start frame/)
  })

  test('rejects a timeline missing the end frame', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: { from: { opacity: 0 }, '50%': { opacity: 0.5 } },
      }),
    ).toThrow(/must define an end frame/)
  })

  test('warns when top-level from/to coexist with a timeline', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    validateSpatializedMotionConfig({
      duration: 1,
      from: { opacity: 0.25 },
      to: { opacity: 0.75 },
      timeline: {
        '0%': { opacity: 0 },
        '100%': { opacity: 1 },
      },
    })
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('top-level from/to are ignored'),
    )
    warnSpy.mockRestore()
  })

  test('rejects a property with only one keyframe', () => {
    // Timeline has overall start/end frames (opacity at 0% and 100%), but the
    // rotate.z property appears only once at 50%, which is fewer than two keyframes.
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: {
          '0%': { opacity: 0 },
          '50%': { transform: { rotate: { z: 45 } } },
          '100%': { opacity: 1 },
        },
      }),
    ).toThrow(/track "transform.rotate.z" needs at least 2 keyframes/)
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

  test.each([
    ['0%', '00%'],
    ['0%', '0.0%'],
    ['50%', '050.0%'],
  ])(
    'rejects equivalent percentage keys %s and %s for the same property',
    (firstKey, secondKey) => {
      expect(() =>
        validateSpatializedMotionConfig({
          duration: 1,
          timeline: {
            '0%': { opacity: 0 },
            [firstKey]: { opacity: 0.25 },
            [secondKey]: { opacity: 0.25 },
            '100%': { opacity: 1 },
          },
        }),
      ).toThrow(/keyframe times must be strictly increasing.*opacity/)
    },
  )

  test('accepts equivalent percentage keys for different properties', () => {
    expect(() =>
      validateSpatializedMotionConfig({
        duration: 1,
        timeline: {
          '0%': { opacity: 0 },
          '0.0%': { transform: { translate: { x: 0 } } },
          '100%': {
            opacity: 1,
            transform: { translate: { x: 1 } },
          },
        },
      }),
    ).not.toThrow()
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
