import { describe, expect, test } from 'vitest'
import { validateSpatialDivAnimationConfig } from './spatialDivAnimationValidator'
import type { SpatialDivAnimationConfig } from '@webspatial/core-sdk'

const validConfig: SpatialDivAnimationConfig = {
  to: { opacity: 0.5 },
  duration: 1.0,
}

describe('validateSpatialDivAnimationConfig', () => {
  // --- Whitelist Validation ---
  describe('whitelist fields', () => {
    test('accepts opacity only', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: { opacity: 0.8 } }),
      ).not.toThrow()
    })

    test('accepts transform.translate', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { translate: { x: 10 } } },
        }),
      ).not.toThrow()
    })

    test('accepts transform.rotate', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { rotate: { z: 90 } } },
        }),
      ).not.toThrow()
    })

    test('accepts transform.scale', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { scale: { x: 2, y: 2, z: 1 } } },
        }),
      ).not.toThrow()
    })

    test('accepts combined opacity + transform', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1, transform: { translate: { y: 50 } } },
        }),
      ).not.toThrow()
    })

    test('rejects layout-affecting fields: width', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, width: 100 } as any,
        }),
      ).toThrow(/layout-affecting/)
    })

    test('rejects layout-affecting fields: height', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1, height: 200 } as any,
        }),
      ).toThrow(/layout-affecting/)
    })

    test('rejects layout-affecting fields: depth', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, depth: 50 } as any,
        }),
      ).toThrow(/layout-affecting/)
    })

    test('rejects layout-affecting fields: back', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, back: 10 } as any,
        }),
      ).toThrow(/layout-affecting/)
    })

    test('rejects layout-affecting fields: backOffset', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, backOffset: 5 } as any,
        }),
      ).toThrow(/layout-affecting/)
    })

    test('rejects unsupported fields: backgroundMaterial', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, backgroundMaterial: 'glass' } as any,
        }),
      ).toThrow(/unsupported/)
    })

    test('rejects unsupported fields: cornerRadius', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, cornerRadius: 10 } as any,
        }),
      ).toThrow(/unsupported/)
    })

    test('rejects entity keys: position', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, position: { x: 1 } } as any,
        }),
      ).toThrow(/entity animation keys/)
    })

    test('rejects entity keys: rotation (entity)', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, rotation: { x: 90 } } as any,
        }),
      ).toThrow(/entity animation keys/)
    })

    test('rejects entity keys: scale (entity)', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 0.5, scale: { x: 2 } } as any,
        }),
      ).toThrow(/entity animation keys/)
    })

    test('rejects empty to', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: {} as any }),
      ).toThrow()
    })

    test('rejects to with no meaningful fields', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: {} } as any,
        }),
      ).toThrow(/at least one/)
    })
  })

  // --- Numeric Validation ---
  describe('numeric ranges', () => {
    test('opacity: rejects < 0', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: { opacity: -0.1 } }),
      ).toThrow(/\[0, 1\]/)
    })

    test('opacity: rejects > 1', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: { opacity: 1.1 } }),
      ).toThrow(/\[0, 1\]/)
    })

    test('opacity: rejects NaN', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: { opacity: NaN } }),
      ).toThrow()
    })

    test('opacity: rejects Infinity', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: { opacity: Infinity } }),
      ).toThrow()
    })

    test('opacity: accepts 0', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: { opacity: 0 } }),
      ).not.toThrow()
    })

    test('opacity: accepts 1', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({ to: { opacity: 1 } }),
      ).not.toThrow()
    })

    test('translate: rejects NaN', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { translate: { x: NaN } } },
        }),
      ).toThrow(/finite/)
    })

    test('translate: rejects Infinity', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { translate: { y: Infinity } } },
        }),
      ).toThrow(/finite/)
    })

    test('rotate: rejects NaN', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { rotate: { z: NaN } } },
        }),
      ).toThrow(/finite/)
    })

    test('scale: rejects NaN', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { scale: { x: NaN } } },
        }),
      ).toThrow(/finite/)
    })

    test('scale: accepts 0 (exit animations)', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { scale: { x: 0 } } },
        }),
      ).not.toThrow()
    })
  })

  // --- Timing Parameter Validation ---
  describe('timing parameters', () => {
    test('duration: rejects 0', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          duration: 0,
        }),
      ).toThrow(/positive finite/)
    })

    test('duration: rejects negative', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          duration: -1,
        }),
      ).toThrow(/positive finite/)
    })

    test('duration: rejects NaN', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          duration: NaN,
        }),
      ).toThrow(/positive finite/)
    })

    test('duration: rejects Infinity', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          duration: Infinity,
        }),
      ).toThrow(/positive finite/)
    })

    test('delay: rejects negative', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          delay: -1,
        }),
      ).toThrow(/non-negative/)
    })

    test('delay: accepts 0', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          delay: 0,
        }),
      ).not.toThrow()
    })

    test('delay: rejects NaN', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          delay: NaN,
        }),
      ).toThrow(/non-negative/)
    })

    test('timingFunction: accepts valid values', () => {
      for (const tf of ['linear', 'easeIn', 'easeOut', 'easeInOut'] as const) {
        expect(() =>
          validateSpatialDivAnimationConfig({
            to: { opacity: 1 },
            timingFunction: tf,
          }),
        ).not.toThrow()
      }
    })

    test('timingFunction: rejects invalid string', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          timingFunction: 'cubic-bezier(0,0,1,1)' as any,
        }),
      ).toThrow(/timingFunction/)
    })

    test('playbackRate: rejects 0', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          playbackRate: 0,
        }),
      ).toThrow(/positive finite/)
    })

    test('playbackRate: rejects negative', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          playbackRate: -1,
        }),
      ).toThrow(/positive finite/)
    })

    test('playbackRate: rejects Infinity', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          playbackRate: Infinity,
        }),
      ).toThrow(/positive finite/)
    })

    test('playbackRate: accepts valid positive value', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          playbackRate: 2.5,
        }),
      ).not.toThrow()
    })
  })

  // --- Loop Validation ---
  describe('loop config', () => {
    test('accepts true', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: true,
        }),
      ).not.toThrow()
    })

    test('accepts false', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: false,
        }),
      ).not.toThrow()
    })

    test('accepts { reverse: true }', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: { reverse: true },
        }),
      ).not.toThrow()
    })

    test('accepts { reverse: false }', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: { reverse: false },
        }),
      ).not.toThrow()
    })

    test('accepts {}', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: {},
        }),
      ).not.toThrow()
    })

    test('rejects invalid shape: number', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: 3 as any,
        }),
      ).toThrow(/loop/)
    })

    test('rejects invalid shape: string', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: 'infinite' as any,
        }),
      ).toThrow(/loop/)
    })

    test('rejects unknown keys in loop object', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: { count: 5 } as any,
        }),
      ).toThrow(/unknown key/)
    })

    test('rejects non-boolean reverse', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { opacity: 1 },
          loop: { reverse: 'yes' } as any,
        }),
      ).toThrow(/boolean/)
    })
  })

  // --- Transform Sub-keys Validation ---
  describe('transform sub-keys', () => {
    test('rejects invalid sub-keys in transform', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { translate: { x: 0 }, skew: { x: 10 } } } as any,
        }),
      ).toThrow(/invalid sub-keys/)
    })

    test('rejects perspective in transform', () => {
      expect(() =>
        validateSpatialDivAnimationConfig({
          to: { transform: { translate: { x: 0 }, perspective: 500 } } as any,
        }),
      ).toThrow(/invalid sub-keys/)
    })
  })
})
