import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import {
  getEnv,
  AVP,
  getFinalBase,
  getFinalOutdir,
  getReactSDKAliasByMode,
  removeFirstSlash,
  addFirstSlash,
} from './pluginUtils'

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

    // web

    test('should return userBase when mode is not "avp" (web version)', () => {
      expect(getFinalBase('/web/path', undefined)).toBe('/web/path')
      expect(getFinalBase('/web/path', undefined, '/ignore/this')).toBe(
        '/web/path',
      )
    })

    test('should return undefined when mode is undefined and userBase is undefined', () => {
      expect(getFinalBase(undefined, undefined)).toBeUndefined()
    })

    // avp

    test('should return webspatial/avp when mode is avp and userBase is undefined', () => {
      expect(getFinalBase(undefined, 'avp')).toBe('/webspatial/avp')
    })

    test('should return webspatial/avp when mode is avp and userBase is undefined', () => {
      expect(getFinalBase(undefined, 'avp', '/base')).toBe('/base')
    })
  })

  describe('getFinalOutdir()', () => {
    test('should combine userOutDir and pluginOutputDir when mode is "avp"', () => {
      expect(getFinalOutdir('dist', 'avp', 'plugin')).toBe('dist/plugin')
    })

    test('should return userOutDir with "/webspatial/avp" when mode is "avp" but pluginOutputDir is missing', () => {
      expect(getFinalOutdir('dist', 'avp')).toBe('dist/webspatial/avp')
      // Note: This might be unexpected behavior, consider adding validation
    })

    test('should return default userOutDir "dist" when no arguments provided', () => {
      expect(getFinalOutdir(undefined, undefined)).toBe('dist')
    })

    test('should return specified userOutDir when mode is not "avp"', () => {
      expect(getFinalOutdir('custom/dist', undefined)).toBe('custom/dist')
    })

    test('should handle trailing slashes correctly in paths', () => {
      expect(getFinalOutdir('dist', 'avp', '/plugin')).toBe('dist/plugin')
    })
  })

  describe('getReactSDK func', () => {
    test('web version', () => {
      expect(getReactSDKAliasByMode()['@webspatial/react-sdk$']).toBe(
        '@webspatial/react-sdk/web',
      )
    })

    test('avp version', () => {
      expect(getReactSDKAliasByMode('avp')['@webspatial/react-sdk$']).toBe(
        '@webspatial/react-sdk/default',
      )
    })
  })

  describe('removeFirstSlash func', () => {
    test('start with /', () => {
      expect(removeFirstSlash('/mybase')).toBe('mybase')
      expect(removeFirstSlash('/my/base/')).toBe('my/base/')
    })

    test('not start with /', () => {
      expect(removeFirstSlash('mybase')).toBe('mybase')
      expect(removeFirstSlash('my/base/')).toBe('my/base/')
    })
  })

  describe('addFirstSlash func', () => {
    test('empty case', () => {
      expect(addFirstSlash()).toBe('')
      expect(addFirstSlash('')).toBe('')
    })

    test('start with /', () => {
      expect(addFirstSlash('/mybase')).toBe('/mybase')
      expect(addFirstSlash('/my/base/')).toBe('/my/base/')
    })

    test('not start with /', () => {
      expect(addFirstSlash('mybase')).toBe('/mybase')
      expect(addFirstSlash('my/base/')).toBe('/my/base/')
    })
  })

  const testCasesForWeb = [
    {
      id: 1,
      input: {
        mode: 'web',
        base: undefined,
        outDir: undefined,
        outputDir: undefined,
      },
      result: {
        finalBase: undefined,
        finalOutDir: 'dist',
      },
    },
    {
      id: 2,
      input: {
        mode: 'web',
        base: 'mybase',
        outDir: undefined,
        outputDir: undefined,
      },
      result: {
        finalBase: 'mybase',
        finalOutDir: 'dist',
      },
    },
    {
      id: 3,
      input: {
        mode: 'web',
        base: undefined,
        outDir: 'myDist',
        outputDir: undefined,
      },
      result: {
        finalBase: undefined,
        finalOutDir: 'myDist',
      },
    },
    {
      id: 4,
      input: {
        mode: 'web',
        base: undefined,
        outDir: undefined,
        outputDir: 'myOutput',
      },
      result: {
        finalBase: undefined,
        finalOutDir: 'dist',
      },
    },
    {
      id: 5,
      input: {
        mode: 'web',
        base: undefined,
        outDir: 'myDist',
        outputDir: 'myOutput',
      },
      result: {
        finalBase: undefined,
        finalOutDir: 'myDist',
      },
    },
    {
      id: 6,
      input: {
        mode: 'web',
        base: 'mybase',
        outDir: 'myDist',
        outputDir: 'myOutput',
      },
      result: {
        finalBase: 'mybase',
        finalOutDir: 'myDist',
      },
    },
  ]

  describe('test for web should work', () => {
    test.each(testCasesForWeb)('input：%j', ({ input, result }) => {
      const actualBase = getFinalBase(
        input.base,
        input.mode as any,
        input.outputDir,
      )
      expect(actualBase).toBe(result.finalBase)

      const actualOutput = getFinalOutdir(
        input.outDir,
        input.mode as any,
        input.outputDir,
      )
      expect(actualOutput).toBe(result.finalOutDir)
    })
  })

  const testCasesForAVP = [
    {
      id: 1,
      input: {
        mode: 'avp',
        base: undefined,
        outDir: undefined,
        outputDir: undefined,
      },
      result: {
        finalBase: '/webspatial/avp',
        finalOutDir: 'dist/webspatial/avp',
      },
    },
    {
      id: 2,
      input: {
        mode: 'avp',
        base: 'mybase',
        outDir: undefined,
        outputDir: undefined,
      },
      result: {
        finalBase: 'mybase',
        finalOutDir: 'dist/webspatial/avp',
      },
    },
    {
      id: 3,
      input: {
        mode: 'avp',
        base: undefined,
        outDir: 'myDist',
        outputDir: undefined,
      },
      result: {
        finalBase: '/webspatial/avp',
        finalOutDir: 'myDist/webspatial/avp',
      },
    },
    {
      id: 4,
      input: {
        mode: 'avp',
        base: undefined,
        outDir: undefined,
        outputDir: 'myOutput',
      },
      result: {
        finalBase: 'myOutput',
        finalOutDir: 'dist/myOutput',
      },
    },
    {
      id: 5,
      input: {
        mode: 'avp',
        base: undefined,
        outDir: 'myDist',
        outputDir: 'myOutput',
      },
      result: {
        finalBase: 'myOutput',
        finalOutDir: 'myDist/myOutput',
      },
    },
    {
      id: 6,
      input: {
        mode: 'avp',
        base: 'mybase',
        outDir: 'myDist',
        outputDir: 'myOutput',
      },
      result: {
        finalBase: 'mybase',
        finalOutDir: 'myDist/myOutput',
      },
    },
  ]

  describe('test for avp should work', () => {
    test.each(testCasesForAVP)('input：%j', ({ input, result }) => {
      const actualBase = getFinalBase(
        input.base,
        input.mode as any,
        input.outputDir,
      )
      expect(actualBase).toBe(result.finalBase)

      const actualOutput = getFinalOutdir(
        input.outDir,
        input.mode as any,
        input.outputDir,
      )
      expect(actualOutput).toBe(result.finalOutDir)
    })
  })
})
