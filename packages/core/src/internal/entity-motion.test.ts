import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import type { EntityMotionConfig } from '../types/motion'
import * as internalEntityMotion from './entity-motion'

describe('internal Entity motion entry', () => {
  test('exports only silent React coordination helpers', () => {
    expect(Object.keys(internalEntityMotion).sort()).toEqual([
      'getEntityMotionExecutionSignature',
      'setEntityAnimationAndWait',
      'validateEntityMotionConfigSilently',
    ])
    expectTypeOf(internalEntityMotion.getEntityMotionExecutionSignature)
      .parameter(0)
      .toEqualTypeOf<EntityMotionConfig>()
    expectTypeOf(
      internalEntityMotion.getEntityMotionExecutionSignature,
    ).returns.toEqualTypeOf<string>()
    expectTypeOf(internalEntityMotion.validateEntityMotionConfigSilently)
      .parameter(0)
      .toEqualTypeOf<EntityMotionConfig>()
    expectTypeOf(
      internalEntityMotion.validateEntityMotionConfigSilently,
    ).returns.toEqualTypeOf<void>()
  })

  test('validates synchronously without emitting the precedence warning', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config: EntityMotionConfig = {
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      timeline: {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      },
      duration: 1,
    }

    internalEntityMotion.validateEntityMotionConfigSilently(config)

    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })
})
