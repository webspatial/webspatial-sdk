import { describe, expect, test, vi, beforeEach } from 'vitest'
import { shallowEqualVec3, shallowEqualRotation } from '../utils/equal'

describe('transform suppression utilities', () => {
  describe('shallowEqualVec3', () => {
    test('returns true for identical Vec3', () => {
      const a = { x: 1, y: 2, z: 3 }
      const b = { x: 1, y: 2, z: 3 }
      expect(shallowEqualVec3(a, b)).toBe(true)
    })

    test('returns false for different Vec3', () => {
      const a = { x: 1, y: 2, z: 3 }
      const b = { x: 1, y: 2, z: 4 }
      expect(shallowEqualVec3(a, b)).toBe(false)
    })

    test('returns false when one is undefined', () => {
      expect(shallowEqualVec3(undefined, { x: 1, y: 2, z: 3 })).toBe(false)
      expect(shallowEqualVec3({ x: 1, y: 2, z: 3 }, undefined)).toBe(false)
    })

    test('returns true when both are undefined', () => {
      expect(shallowEqualVec3(undefined, undefined)).toBe(true)
    })
  })

  describe('shallowEqualRotation', () => {
    test('returns true for identical rotation', () => {
      const a = { x: 30, y: 45, z: 60 }
      const b = { x: 30, y: 45, z: 60 }
      expect(shallowEqualRotation(a, b)).toBe(true)
    })

    test('returns false for different rotation', () => {
      const a = { x: 30, y: 45, z: 60 }
      const b = { x: 30, y: 90, z: 60 }
      expect(shallowEqualRotation(a, b)).toBe(false)
    })
  })
})
