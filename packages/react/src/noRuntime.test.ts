import { describe, expect, it } from 'vitest'
import { PhysicalMetrics } from './noRuntime'

describe('noRuntime PhysicalMetrics', () => {
  it('subscribe returns an unsubscribe function in no-runtime builds', () => {
    const unsubscribe = PhysicalMetrics.subscribe(() => {})
    expect(typeof unsubscribe).toBe('function')
    expect(() => unsubscribe()).not.toThrow()
  })
})
