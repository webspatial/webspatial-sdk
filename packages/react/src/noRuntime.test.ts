import { describe, expect, it } from 'vitest'
import {
  PhysicalMetrics,
  SpatializedMotionController,
  evaluateMotionTimeline,
  normalizeMotionConfig,
  validateSpatializedMotionConfig,
} from './noRuntime'

describe('noRuntime PhysicalMetrics', () => {
  it('subscribe returns an unsubscribe function in no-runtime builds', () => {
    const unsubscribe = PhysicalMetrics.subscribe(() => {})
    expect(typeof unsubscribe).toBe('function')
    expect(() => unsubscribe()).not.toThrow()
  })
})

describe('noRuntime motion exports', () => {
  it('exposes no-op motion helpers for web no-runtime builds', () => {
    const config = normalizeMotionConfig({
      duration: 1,
      from: { opacity: 0 },
      to: { opacity: 1 },
      autoStart: false,
    })

    validateSpatializedMotionConfig(config)

    const values = evaluateMotionTimeline(config, 0.5)
    expect(values).toEqual({})

    const controller = new SpatializedMotionController(config, {
      supportsMotionKind: () => false,
    })
    expect(controller.playState).toBe('idle')
    expect(controller.isAnimating).toBe(false)

    controller.play()
    expect(controller.playState).toBe('idle')

    controller.finish()
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
  })
})
