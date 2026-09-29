import { describe, expect, it } from 'vitest'
import { applyParentRotation } from './gestureRotation'

describe('parent-local cumulative rotation', () => {
  it('preserves the starting orientation for an identity delta', () => {
    const result = applyParentRotation(
      { x: 25, y: -35, z: 60 },
      { x: 0, y: 0, z: 0, w: 1 },
    )
    expect(result.x).toBeCloseTo(25)
    expect(result.y).toBeCloseTo(-35)
    expect(result.z).toBeCloseTo(60)
  })

  it('rotates about parent X, not the already rotated target X', () => {
    const result = applyParentRotation(
      { x: 0, y: 0, z: 90 },
      { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    )
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(-90)
    expect(result.z).toBeCloseTo(90)
  })

  it('applies each cumulative sample to the fixed start, without accumulating earlier samples', () => {
    const start = { x: 0, y: 0, z: 10 }
    for (const degrees of [15, 30, 30, 45]) {
      const halfAngle = (degrees * Math.PI) / 360
      const result = applyParentRotation(start, {
        x: 0,
        y: 0,
        z: Math.sin(halfAngle),
        w: Math.cos(halfAngle),
      })
      expect(result.z).toBeCloseTo(10 + degrees)
    }
    expect(start).toEqual({ x: 0, y: 0, z: 10 })
  })
})
