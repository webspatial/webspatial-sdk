import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { formatSceneConfig } from './scene-polyfill'
import { SpatialSceneCreationOptions } from './types/types'

describe('test formatSceneConfig in window', () => {
  test('should format window with no unit', () => {
    const config = {
      defaultSize: {
        width: 100,
        height: 100,
      },
      resizability: {
        minWidth: 100,
        minHeight: 100,
        maxWidth: 100,
        maxHeight: 100,
      },
      type: 'window',
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config)
    expect(formattedConfig.defaultSize).toEqual({
      width: 100,
      height: 100,
    })
    expect(formattedConfig.resizability).toEqual({
      minWidth: 100,
      minHeight: 100,
      maxWidth: 100,
      maxHeight: 100,
    })
  })

  test('should format window with px', () => {
    const config = {
      defaultSize: {
        width: '100px',
        height: '100px',
      },
      resizability: {
        minWidth: '100px',
        minHeight: '100px',
        maxWidth: '100px',
        maxHeight: '100px',
      },
      type: 'window',
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config)
    expect(formattedConfig.defaultSize).toEqual({
      width: 100,
      height: 100,
    })
    expect(formattedConfig.resizability).toEqual({
      minWidth: 100,
      minHeight: 100,
      maxWidth: 100,
      maxHeight: 100,
    })
  })

  test('should format window with meter', () => {
    const config = {
      defaultSize: {
        width: '1m',
        height: '1m',
      },
      resizability: {
        minWidth: '1m',
        minHeight: '1m',
        maxWidth: '1m',
        maxHeight: '1m',
      },
      type: 'window',
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config)
    expect(formattedConfig.defaultSize).toEqual({
      width: 1360,
      height: 1360,
    })
    expect(formattedConfig.resizability).toEqual({
      minWidth: 1360,
      minHeight: 1360,
      maxWidth: 1360,
      maxHeight: 1360,
    })
  })
})

describe('test formatSceneConfig in volume', () => {
  test('should format volume with no unit', () => {
    const config = {
      defaultSize: {
        width: 1,
        height: 1,
        depth: 1,
      },
      resizability: {
        minWidth: 1,
        minHeight: 1,
        maxWidth: 1,
        maxHeight: 1,
      },
      type: 'volume',
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config)
    expect(formattedConfig.defaultSize).toEqual({
      width: 1,
      height: 1,
      depth: 1,
    })
    expect(formattedConfig.resizability).toEqual({
      minWidth: 1360,
      minHeight: 1360,
      maxWidth: 1360,
      maxHeight: 1360,
    })
  })

  test('should format volume with px', () => {
    const config = {
      defaultSize: {
        width: '1360px',
        height: '1360px',
        depth: '1360px',
      },
      resizability: {
        minWidth: '1360px',
        minHeight: '1360px',
        maxWidth: '1360px',
        maxHeight: '1360px',
      },
      type: 'volume',
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config)
    expect(formattedConfig.defaultSize).toEqual({
      width: 1,
      height: 1,
      depth: 1,
    })
    expect(formattedConfig.resizability).toEqual({
      minWidth: 1360,
      minHeight: 1360,
      maxWidth: 1360,
      maxHeight: 1360,
    })
  })

  test('should format volume with meter', () => {
    const config = {
      defaultSize: {
        width: '1m',
        height: '1m',
        depth: '1m',
      },
      resizability: {
        minWidth: '1m',
        minHeight: '1m',
        maxWidth: '1m',
        maxHeight: '1m',
      },
      type: 'volume',
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config)
    expect(formattedConfig.defaultSize).toEqual({
      width: 1,
      height: 1,
      depth: 1,
    })
    expect(formattedConfig.resizability).toEqual({
      minWidth: 1360,
      minHeight: 1360,
      maxWidth: 1360,
      maxHeight: 1360,
    })
  })
})
