import { afterEach, describe, expect, test, vi } from 'vitest'
import { getEntityMotionExecutionSignature } from '../../internal/entity-motion'
import {
  normalizeEntityMotionConfig,
  serializeEntityMotionTimeline,
  validateEntityMotionConfig,
  validateEntityTransformUpdate,
} from './index'

describe('normalizeEntityMotionConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('normalizes top-level boundaries with public defaults', () => {
    const normalized = normalizeEntityMotionConfig({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
    })

    expect(normalized).toEqual({
      duration: 0.3,
      delay: 0,
      playbackRate: 1,
      loop: false,
      tracks: [
        {
          property: 'position.x',
          timingFunction: 'easeInOut',
          keyframes: [
            { at: 0, value: 0 },
            { at: 0.3, value: 1 },
          ],
        },
      ],
    })
  })

  test('normalizes mixed boundaries and percentage keyframes', () => {
    expect(
      normalizeEntityMotionConfig({
        duration: 2,
        timingFunction: 'linear',
        timeline: {
          from: { position: { y: 0 }, timingFunction: 'easeIn' },
          '50%': { position: { y: 1 }, timingFunction: 'easeOut' },
          to: { position: { y: 0 } },
        },
      }),
    ).toMatchObject({
      duration: 2,
      tracks: [
        {
          property: 'position.y',
          timingFunction: 'linear',
          keyframes: [
            { at: 0, value: 0, timingFunction: 'easeIn' },
            { at: 1, value: 1, timingFunction: 'easeOut' },
            { at: 2, value: 0 },
          ],
        },
      ],
    })
  })

  test('uses timeline authoring and warns when top-level boundaries coexist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(
      normalizeEntityMotionConfig({
        from: { position: { x: 10 } },
        to: { position: { x: 20 } },
        duration: 1,
        timeline: {
          from: { position: { x: 0 } },
          to: { position: { x: 1 } },
        },
      }),
    ).toMatchObject({
      tracks: [
        {
          property: 'position.x',
          keyframes: [
            { at: 0, value: 0 },
            { at: 1, value: 1 },
          ],
        },
      ],
    })
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  test('keeps timeline precedence silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    normalizeEntityMotionConfig({
      from: { position: { x: 10 } },
      to: { position: { x: 20 } },
      duration: 1,
      timeline: {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      },
    })

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  test('preserves sparse channel ranges for native baseline interpolation', () => {
    expect(
      normalizeEntityMotionConfig({
        duration: 2,
        timeline: {
          from: { position: { x: 0 } },
          '50%': { rotation: { y: 90 } },
          to: { position: { x: 1 } },
        },
      }),
    ).toMatchObject({
      tracks: [
        {
          property: 'position.x',
          keyframes: [
            { at: 0, value: 0 },
            { at: 2, value: 1 },
          ],
        },
        {
          property: 'rotation.y',
          keyframes: [{ at: 1, value: 90 }],
        },
      ],
    })
  })
})

describe('Entity motion validation', () => {
  test.each([
    [{ from: { position: { x: 0 } } }, 'both from and to'],
    [
      {
        duration: 1,
        timeline: { from: { position: { x: 0 } } },
      },
      'start and end boundaries',
    ],
    [
      {
        duration: 1,
        timeline: {
          from: { position: { x: 0 } },
          '0%': { position: { x: 0 } },
          to: { position: { x: 1 } },
        },
      },
      'duplicate 0% boundary',
    ],
    [
      {
        duration: 1,
        timeline: {
          from: { position: { x: 0 } },
          to: { position: { x: 1 } },
          '100%': { position: { x: 1 } },
        },
      },
      'duplicate 100% boundary',
    ],
    [
      {
        duration: 1,
        timeline: {
          from: { position: { x: 0 } },
          '120%': { position: { x: 1 } },
          to: { position: { x: 2 } },
        },
      },
      'percentage',
    ],
    [
      {
        duration: 1,
        timeline: {
          from: { position: { x: 0 } },
          '50%': {},
          to: { position: { x: 1 } },
        },
      },
      'at least one transform scalar',
    ],
  ] as const)('rejects invalid config %#', (config, message) => {
    expect(() => validateEntityMotionConfig(config as never)).toThrow(message)
  })

  test('rejects legacy and unsupported authoring', () => {
    expect(() =>
      validateEntityMotionConfig({
        to: { opacity: 1 },
      } as never),
    ).toThrow('unsupported')
  })

  test.each([
    [{ to: { position: { x: 1 } } }, 'both from and to'],
    [{ duration: 1, timeline: {} }, 'must not be empty'],
    [
      {
        duration: 1,
        timeline: {
          from: { position: { x: 0 } },
          '50%': { position: { x: 1 } },
        },
      },
      'start and end boundaries',
    ],
    [
      {
        duration: 1,
        timeline: {
          from: { position: { x: 0 } },
          '50%': { position: { x: 1 } },
          '050%': { position: { x: 2 } },
          to: { position: { x: 3 } },
        },
      },
      'duplicate normalized percentage',
    ],
  ])(
    'rejects missing, empty, or duplicate boundaries %#',
    (config, message) => {
      expect(() => validateEntityMotionConfig(config as never)).toThrow(message)
    },
  )

  test.each([
    [
      { from: { position: { x: 0 } }, to: { position: { x: 1 } }, duration: 0 },
      'positive',
    ],
    [
      { from: { position: { x: 0 } }, to: { position: { x: 1 } }, delay: -1 },
      'non-negative',
    ],
    [
      {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        playbackRate: Number.NaN,
      },
      'finite',
    ],
    [
      { from: { position: { x: 0 } }, to: { position: { x: Infinity } } },
      'finite',
    ],
    [{ from: { scale: { x: 1 } }, to: { scale: { x: -1 } } }, 'non-negative'],
    [
      {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        timingFunction: 'spring',
      },
      'must be linear',
    ],
    [
      {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        loop: { reverse: 'yes' },
      },
      'must be a boolean',
    ],
    [
      {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        autoStart: 'yes',
      },
      'must be a boolean',
    ],
  ])('rejects invalid numeric and option values %#', (config, message) => {
    expect(() => validateEntityMotionConfig(config as never)).toThrow(message)
  })

  test.each([
    ['duration', 0, 'positive'],
    ['duration', -1, 'positive'],
    ['duration', Number.NaN, 'finite'],
    ['duration', Number.POSITIVE_INFINITY, 'finite'],
    ['duration', Number.NEGATIVE_INFINITY, 'finite'],
    ['delay', -1, 'non-negative'],
    ['delay', Number.NaN, 'finite'],
    ['delay', Number.POSITIVE_INFINITY, 'finite'],
    ['delay', Number.NEGATIVE_INFINITY, 'finite'],
    ['playbackRate', 0, 'positive'],
    ['playbackRate', -1, 'positive'],
    ['playbackRate', Number.NaN, 'finite'],
    ['playbackRate', Number.POSITIVE_INFINITY, 'finite'],
    ['playbackRate', Number.NEGATIVE_INFINITY, 'finite'],
  ])('rejects config.%s=%s', (key, value, message) => {
    expect(() =>
      validateEntityMotionConfig({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        [key]: value,
      }),
    ).toThrow(message)
  })

  test('accepts zero delay', () => {
    expect(() =>
      validateEntityMotionConfig({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        delay: 0,
      }),
    ).not.toThrow()
  })

  test('rejects legacy transform nesting', () => {
    expect(() =>
      validateEntityMotionConfig({
        from: { transform: { position: { x: 0 } } },
        to: { transform: { position: { x: 1 } } },
      } as never),
    ).toThrow('unsupported')
  })

  test.each(['translate', 'rotate', 'scale'])(
    'rejects legacy transform.%s nesting',
    legacyKey => {
      expect(() =>
        validateEntityMotionConfig({
          from: {
            transform: {
              [legacyKey]: { x: 0, y: 0, z: 0 },
            },
          },
          to: {
            transform: {
              [legacyKey]: { x: 1, y: 1, z: 1 },
            },
          },
        } as never),
      ).toThrow('unsupported')
    },
  )

  test.each([
    [{}, 'at least one transform scalar'],
    [{ position: {} }, 'at least one transform scalar'],
    [{ scale: { x: -1 } }, 'non-negative'],
    [{ rotation: { y: Number.NaN } }, 'finite'],
  ])('rejects invalid set update %#', (update, message) => {
    expect(() => validateEntityTransformUpdate(update)).toThrow(message)
  })
})

describe('Entity motion execution signature', () => {
  test('normalizes equivalent public boundary authoring to one opaque string', () => {
    const topLevel = getEntityMotionExecutionSignature({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
    })
    const namedTimeline = getEntityMotionExecutionSignature({
      duration: 0.3,
      timeline: {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      },
    })
    const percentageTimeline = getEntityMotionExecutionSignature({
      duration: 0.3,
      timeline: {
        '0%': { position: { x: 0 } },
        '100%': { position: { x: 1 } },
      },
    })
    const explicitDefaults = getEntityMotionExecutionSignature({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      duration: 0.3,
      timingFunction: 'easeInOut',
      delay: 0,
      playbackRate: 1,
      loop: false,
      autoStart: true,
    })

    expect(namedTimeline).toBe(topLevel)
    expect(percentageTimeline).toBe(topLevel)
    expect(explicitDefaults).toBe(topLevel)
    expect(typeof topLevel).toBe('string')
  })

  test('excludes callbacks and includes every execution option', () => {
    const base = {
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
    } as const
    const first = getEntityMotionExecutionSignature({
      ...base,
      onStart: vi.fn(),
      onError: vi.fn(),
    })
    const callbackOnly = getEntityMotionExecutionSignature({
      ...base,
      onStart: vi.fn(),
      onError: vi.fn(),
    })

    expect(callbackOnly).toBe(first)
    for (const config of [
      { ...base, duration: 2 },
      { ...base, timingFunction: 'linear' as const },
      { ...base, delay: 1 },
      { ...base, playbackRate: 2 },
      { ...base, loop: true },
      { ...base, autoStart: false },
      {
        from: { position: { x: 0 } },
        to: { position: { x: 2 } },
      },
    ]) {
      expect(getEntityMotionExecutionSignature(config)).not.toBe(first)
    }
  })

  test('does not amplify the public timeline-precedence warning', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config = {
      from: { position: { x: 10 } },
      to: { position: { x: 20 } },
      duration: 1,
      timeline: {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      },
    }

    validateEntityMotionConfig(config)
    getEntityMotionExecutionSignature(config)

    expect(warning).toHaveBeenCalledOnce()
    warning.mockRestore()
  })
})

describe('serializeEntityMotionTimeline', () => {
  test('creates a detached wire payload', () => {
    const normalized = normalizeEntityMotionConfig({
      from: { scale: { x: 1 } },
      to: { scale: { x: 2 } },
    })
    const payload = serializeEntityMotionTimeline(normalized)

    expect(payload).toEqual(normalized)
    expect(payload).not.toBe(normalized)
    expect(payload.tracks).not.toBe(normalized.tracks)
    expect(payload.tracks[0].keyframes).not.toBe(normalized.tracks[0].keyframes)
  })
})
