import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AnimationConfig } from '@webspatial/core-sdk'
import { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as sdk from '../index'
import {
  __getSpatialLoadAttemptForTests,
  __resetSpatialBridgeForTests,
} from '../runtime/bridge'
import type { SpatializedMotionConfig } from '../spatialized-container/motion'

const __dirname = dirname(fileURLToPath(import.meta.url))
const useAnimationSource = readFileSync(
  resolve(__dirname, 'useAnimation.ts'),
  'utf8',
)
const useEntityAnimationSource = readFileSync(
  resolve(__dirname, 'useEntityAnimation.ts'),
  'utf8',
)

const spatializedConfig: SpatializedMotionConfig = {
  from: { opacity: 0 },
  to: { opacity: 1 },
}

function useAnimationFromDefault() {
  return (sdk as Record<string, unknown>).useAnimation as (
    config: SpatializedMotionConfig,
  ) => unknown
}

function useEntityAnimationFromDefault() {
  return (sdk as Record<string, unknown>).useEntityAnimation as (
    config: AnimationConfig,
  ) => unknown
}

describe('useAnimation default-entry facade', () => {
  beforeEach(() => {
    __resetSpatialBridgeForTests()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    __resetSpatialBridgeForTests()
  })

  it('returns a web fallback tuple before bootSpatial readiness without scheduling the spatial chunk', () => {
    const useAnimation = useAnimationFromDefault()

    const { result } = renderHook(() => useAnimation(spatializedConfig))

    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current).toHaveLength(3)
    expect(__getSpatialLoadAttemptForTests()).toBe(0)
  })

  it('keeps entity animation ready-gated before bootSpatial readiness', () => {
    const useEntityAnimation = useEntityAnimationFromDefault()

    const entityConfig: AnimationConfig = {
      to: { position: { x: 0, y: 0, z: 0 } },
    }
    try {
      renderHook(() => useEntityAnimation(entityConfig))
    } catch (error) {
      expect(error).toBeInstanceOf(WebSpatialRuntimeError)
      expect((error as WebSpatialRuntimeError).capability).toBe(
        'useEntityAnimation',
      )
      expect(String((error as Error).message)).toMatch(/SpatialBoot/)
      expect(String((error as Error).message)).toMatch(/bootSpatial\(\)/)
    }
  })

  it('does not import or schedule the spatial chunk by itself', () => {
    expect(useAnimationSource).not.toMatch(/['"][^'"]*\/spatial['"]/)
    expect(useAnimationSource).not.toMatch(/from\s+['"][^'"]*runtime\/boot['"]/)
    expect(useAnimationSource).not.toMatch(/\bloadSpatialImpl\b/)
    expect(useAnimationSource).not.toMatch(/\bimport\s*\(/)
  })

  it('keeps entity animation in a dedicated facade file', () => {
    expect(useAnimationSource).not.toMatch(/\buseEntityAnimation\b/)
    expect(useEntityAnimationSource).toMatch(/\buseEntityAnimation\b/)
    expect(useEntityAnimationSource).toMatch(/\bgetSpatialImpl\b/)
  })
})
