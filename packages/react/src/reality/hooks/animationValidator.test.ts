import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  validateAnimationConfig,
  getAnimatedFields,
} from './animationValidator'

describe('animationValidator', () => {
  describe('validateAnimationConfig', () => {
    test('throws if config.to is missing', () => {
      expect(() => validateAnimationConfig({ to: undefined as any })).toThrow(
        '[useAnimation] config.to is required',
      )
    })

    test('throws if config.to has no transform fields', () => {
      expect(() => validateAnimationConfig({ to: {} })).toThrow(
        'config.to must specify at least one of position, rotation, or scale',
      )
    })

    test('accepts config.to with position only', () => {
      expect(() =>
        validateAnimationConfig({ to: { position: { x: 0, y: 0, z: 0 } } }),
      ).not.toThrow()
    })

    test('accepts config.to with rotation only', () => {
      expect(() =>
        validateAnimationConfig({ to: { rotation: { x: 0, y: 90, z: 0 } } }),
      ).not.toThrow()
    })

    test('accepts config.to with scale only', () => {
      expect(() =>
        validateAnimationConfig({ to: { scale: { x: 2, y: 2, z: 2 } } }),
      ).not.toThrow()
    })

    test('throws if duration is 0', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          duration: 0,
        }),
      ).toThrow('duration must be a positive finite number')
    })

    test('throws if duration is negative', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          duration: -1,
        }),
      ).toThrow('duration must be a positive finite number')
    })

    test('throws if duration is Infinity', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          duration: Infinity,
        }),
      ).toThrow('duration must be a positive finite number')
    })

    test('throws if delay is negative', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          delay: -0.5,
        }),
      ).toThrow('delay must be a non-negative finite number')
    })

    test('accepts delay of 0', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          delay: 0,
        }),
      ).not.toThrow()
    })

    test('throws if timingFunction is invalid', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          timingFunction: 'bounce' as any,
        }),
      ).toThrow('config.timingFunction must be one of')
    })

    test('accepts valid timingFunction values', () => {
      for (const tf of ['linear', 'easeIn', 'easeOut', 'easeInOut'] as const) {
        expect(() =>
          validateAnimationConfig({
            to: { position: { x: 1, y: 0, z: 0 } },
            timingFunction: tf,
          }),
        ).not.toThrow()
      }
    })

    test('accepts loop: true', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          loop: true,
        }),
      ).not.toThrow()
    })

    test('accepts loop: false', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          loop: false,
        }),
      ).not.toThrow()
    })

    test('accepts loop: { reverse: true }', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          loop: { reverse: true },
        }),
      ).not.toThrow()
    })

    test('throws on loop with unknown keys', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          loop: { reverse: true, count: 3 } as any,
        }),
      ).toThrow('config.loop object contains unknown key "count"')
    })

    test('throws on non-finite position components', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: NaN, y: 0, z: 0 } },
        }),
      ).toThrow('to.position components must be finite numbers')
    })

    test('throws on negative scale components', () => {
      expect(() =>
        validateAnimationConfig({
          to: { scale: { x: -1, y: 1, z: 1 } },
        }),
      ).toThrow('to.scale components must be non-negative')
    })

    test('validates from transform values', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          from: { position: { x: Infinity, y: 0, z: 0 } },
        }),
      ).toThrow('from.position components must be finite numbers')
    })

    test('throws if playbackRate is 0', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          playbackRate: 0,
        }),
      ).toThrow('playbackRate must be a positive finite number')
    })

    test('throws if playbackRate is negative', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          playbackRate: -1,
        }),
      ).toThrow('playbackRate must be a positive finite number')
    })

    test('throws if playbackRate is NaN', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          playbackRate: NaN,
        }),
      ).toThrow('playbackRate must be a positive finite number')
    })

    test('throws if playbackRate is Infinity', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          playbackRate: Infinity,
        }),
      ).toThrow('playbackRate must be a positive finite number')
    })

    test('accepts valid playbackRate', () => {
      expect(() =>
        validateAnimationConfig({
          to: { position: { x: 1, y: 0, z: 0 } },
          playbackRate: 2,
        }),
      ).not.toThrow()
    })
  })

  describe('getAnimatedFields', () => {
    test('returns position when to.position is defined', () => {
      const fields = getAnimatedFields({
        to: { position: { x: 1, y: 0, z: 0 } },
      })
      expect(fields).toEqual(['position'])
    })

    test('returns rotation when to.rotation is defined', () => {
      const fields = getAnimatedFields({
        to: { rotation: { x: 0, y: 90, z: 0 } },
      })
      expect(fields).toEqual(['rotation'])
    })

    test('returns scale when to.scale is defined', () => {
      const fields = getAnimatedFields({
        to: { scale: { x: 2, y: 2, z: 2 } },
      })
      expect(fields).toEqual(['scale'])
    })

    test('returns all fields when all are defined', () => {
      const fields = getAnimatedFields({
        to: {
          position: { x: 1, y: 0, z: 0 },
          rotation: { x: 0, y: 90, z: 0 },
          scale: { x: 2, y: 2, z: 2 },
        },
      })
      expect(fields).toEqual(['position', 'rotation', 'scale'])
    })

    test('returns empty for undefined fields', () => {
      const fields = getAnimatedFields({ to: {} as any })
      expect(fields).toEqual([])
    })
  })
})
