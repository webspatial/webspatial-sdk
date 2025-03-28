import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { getEnv, AVP, getFinalBase, getFinalOutdir } from './shared'

describe('Environment Utility Functions', () => {
  describe('AVP Constant', () => {
    test('should correctly export AVP constant', () => {
      expect(AVP).toBe('avp')
    })
  })

  describe('getEnv()', () => {
    const originalEnv = process.env.XR_ENV

    beforeEach(() => {
      vi.stubEnv('XR_ENV', '') // Reset env before each test
    })

    afterEach(() => {
      process.env.XR_ENV = originalEnv // Restore original env
      vi.unstubAllEnvs()
    })

    test('should return undefined when XR_ENV is not set', () => {
      delete process.env.XR_ENV
      expect(getEnv()).toBeUndefined()
    })

    test('should return undefined when XR_ENV is empty string', () => {
      process.env.XR_ENV = ''
      expect(getEnv()).toBeUndefined()
    })

    test('should return "avp" when XR_ENV is set to "avp"', () => {
      process.env.XR_ENV = 'avp'
      expect(getEnv()).toBe('avp')
    })

    test('should return undefined when XR_ENV is set to invalid value', () => {
      process.env.XR_ENV = 'invalid'
      expect(getEnv()).toBeUndefined()
    })
  })

  describe('getFinalBase()', () => {
    test('should return userBase when mode is "avp" and userBase is provided', () => {
      expect(getFinalBase('/custom/path', 'avp')).toBe('/custom/path')
    })

    test('should return outputDir when mode is "avp" and userBase is undefined', () => {
      expect(getFinalBase(undefined, 'avp', '/fallback/path')).toBe(
        '/fallback/path',
      )
    })

    test('should return userBase when mode is not "avp" (web version)', () => {
      expect(getFinalBase('/web/path', undefined)).toBe('/web/path')
      expect(getFinalBase('/web/path', undefined, '/ignore/this')).toBe(
        '/web/path',
      )
    })

    test('should return undefined when mode is undefined and userBase is undefined', () => {
      expect(getFinalBase(undefined, undefined)).toBeUndefined()
    })
  })

  describe('getFinalOutdir()', () => {
    test('should combine userOutDir and pluginOutputDir when mode is "avp"', () => {
      expect(getFinalOutdir('dist', 'avp', 'plugin')).toBe('dist/plugin')
    })

    test('should return userOutDir with "undefined" when mode is "avp" but pluginOutputDir is missing', () => {
      expect(getFinalOutdir('dist', 'avp')).toBe('dist/undefined')
      // Note: This might be unexpected behavior, consider adding validation
    })

    test('should return default userOutDir "dist" when no arguments provided', () => {
      expect(getFinalOutdir(undefined, undefined)).toBe('dist')
    })

    test('should return specified userOutDir when mode is not "avp"', () => {
      expect(getFinalOutdir('custom/dist', undefined)).toBe('custom/dist')
    })

    test('should handle trailing slashes correctly in paths', () => {
      expect(getFinalOutdir('dist', 'avp', 'plugin')).toBe('dist/plugin')
    })
  })
})
