import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  AnimatedProps,
  AnimationApi,
  AnimationConfig,
} from '@webspatial/core-sdk'
import { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as sdk from '../index'
import {
  __getSpatialLoadAttemptForTests,
  __internalSetSpatialImpl,
  __resetSpatialBridgeForTests,
  type SpatialImplementation,
} from '../runtime/bridge'

const __dirname = dirname(fileURLToPath(import.meta.url))
const useAnimationSource = readFileSync(
  resolve(__dirname, 'useAnimation.ts'),
  'utf8',
)

const baseConfig: AnimationConfig = {
  to: { position: { x: 0, y: 0, z: 0 } },
}

function useAnimationFromDefault() {
  return (sdk as Record<string, unknown>).useAnimation as (
    config: AnimationConfig,
  ) => [AnimatedProps, AnimationApi]
}

describe('useAnimation default-entry facade', () => {
  beforeEach(() => {
    __resetSpatialBridgeForTests()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    __resetSpatialBridgeForTests()
  })

  it('throws WebSpatialRuntimeError before bootSpatial readiness without scheduling the spatial chunk', () => {
    const useAnimation = useAnimationFromDefault()

    expect(() => useAnimation(baseConfig)).toThrow(WebSpatialRuntimeError)
    expect(__getSpatialLoadAttemptForTests()).toBe(0)

    try {
      useAnimation(baseConfig)
    } catch (error) {
      expect(error).toBeInstanceOf(WebSpatialRuntimeError)
      expect((error as WebSpatialRuntimeError).capability).toBe('useAnimation')
      expect(String((error as Error).message)).toMatch(/SpatialBoot/)
      expect(String((error as Error).message)).toMatch(/bootSpatial\(\)/)
    }
  })

  it('delegates synchronously to the loaded spatial implementation after bootSpatial readiness', () => {
    const tuple = [
      { kind: 'animated-props' },
      { start: vi.fn() },
    ] as unknown as [AnimatedProps, AnimationApi]
    const realUseAnimation = vi.fn(() => tuple)
    __internalSetSpatialImpl({
      useAnimation: realUseAnimation,
    } as unknown as SpatialImplementation)

    const useAnimation = useAnimationFromDefault()

    expect(useAnimation(baseConfig)).toBe(tuple)
    expect(realUseAnimation).toHaveBeenCalledTimes(1)
    expect(realUseAnimation).toHaveBeenCalledWith(baseConfig)
  })

  it('does not import or schedule the spatial chunk by itself', () => {
    expect(useAnimationSource).not.toMatch(/['"][^'"]*\/spatial['"]/)
    expect(useAnimationSource).not.toMatch(/from\s+['"][^'"]*runtime\/boot['"]/)
    expect(useAnimationSource).not.toMatch(/\bloadSpatialImpl\b/)
    expect(useAnimationSource).not.toMatch(/\bimport\s*\(/)
  })
})
