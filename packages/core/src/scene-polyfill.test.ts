import { describe, expect, test, vi, beforeEach, afterEach, it } from 'vitest'
import {
  formatSceneConfig,
  initScene,
  injectSceneHook,
  __getSceneConfigSnapshotForTest,
} from './scene-polyfill'
import { SpatialSceneCreationOptions } from './types/types'
import { pointToPhysical } from './physicalMetrics'

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
    } satisfies SpatialSceneCreationOptions
    const [formattedConfig] = formatSceneConfig(config, 'window')
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
    } satisfies SpatialSceneCreationOptions
    const [formattedConfig] = formatSceneConfig(config, 'window')
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

  test('should format window with invalid unit', () => {
    const config = {
      defaultSize: {
        width: '100cm',
        height: '100cm',
      },
      resizability: {
        minWidth: '100cm',
        minHeight: '100cm',
        maxWidth: '100cm',
        maxHeight: '100cm',
      },
    } satisfies SpatialSceneCreationOptions
    const [, errors] = formatSceneConfig(config, 'window')
    expect(errors).toEqual([
      'defaultSize.width',
      'defaultSize.height',
      'resizability.minWidth',
      'resizability.minHeight',
      'resizability.maxWidth',
      'resizability.maxHeight',
    ])
  })

  test('window mixed units: cm invalid and numbers treated as px', () => {
    const config = {
      defaultSize: {
        width: '10cm',
        height: 800,
      },
    } satisfies SpatialSceneCreationOptions
    const [formatted, errors] = formatSceneConfig(config, 'window')
    expect(errors).toEqual(['defaultSize.width'])
    expect(formatted.defaultSize).toEqual(
      expect.objectContaining({
        height: 800,
      }),
    )
    expect((formatted.defaultSize as any).width).toBeUndefined()
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
    } satisfies SpatialSceneCreationOptions
    const [formattedConfig] = formatSceneConfig(config, 'window')
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

describe('formatSceneConfig invalid unit (mixed)', () => {
  test('volume defaultSize width cm invalid while numbers convert', () => {
    const config = {
      defaultSize: {
        width: '10cm',
        height: 1000,
        depth: 100,
      },
    } satisfies SpatialSceneCreationOptions
    const [formattedConfig, errors] = formatSceneConfig(config, 'volume')
    expect(errors).toEqual(['defaultSize.width'])
    expect(formattedConfig.defaultSize).toEqual(
      expect.objectContaining({
        height: pointToPhysical(1000),
        depth: pointToPhysical(100),
      }),
    )
    expect((formattedConfig.defaultSize as any).width).toBeUndefined()
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
    } satisfies SpatialSceneCreationOptions
    const [formattedConfig] = formatSceneConfig(config, 'volume')
    expect(formattedConfig.defaultSize).toEqual({
      width: pointToPhysical(1),
      height: pointToPhysical(1),
      depth: pointToPhysical(1),
    })
    expect(formattedConfig.resizability).toEqual({
      minWidth: 1,
      minHeight: 1,
      maxWidth: 1,
      maxHeight: 1,
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
    } satisfies SpatialSceneCreationOptions
    const [formattedConfig] = formatSceneConfig(config, 'volume')
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
    } satisfies SpatialSceneCreationOptions
    const [formattedConfig] = formatSceneConfig(config, 'volume')
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

  test('should format volume with invalid unit', () => {
    const config = {
      defaultSize: {
        width: '100cm',
        height: '100cm',
        depth: '100cm',
      },
      resizability: {
        minWidth: '100cm',
        minHeight: '100cm',
        maxWidth: '100cm',
        maxHeight: '100cm',
      },
    } satisfies SpatialSceneCreationOptions
    const [, errors] = formatSceneConfig(config, 'volume')
    expect(errors).toEqual([
      'defaultSize.width',
      'defaultSize.height',
      'defaultSize.depth',
      'resizability.minWidth',
      'resizability.minHeight',
      'resizability.maxWidth',
      'resizability.maxHeight',
    ])
  })
})

vi.mock('./JSBCommand', () => {
  return {
    GetSpatialSceneState: vi.fn().mockImplementation(() => ({
      execute: vi.fn().mockResolvedValue({ data: { name: 'pending' } }),
    })),
    UpdateSceneConfig: vi.fn().mockImplementation(() => ({
      execute: vi.fn().mockResolvedValue(undefined),
    })),
    UpdateSpatialSceneProperties: vi.fn().mockImplementation(() => ({
      execute: vi.fn().mockResolvedValue(undefined),
    })),
    AddSpatializedElementToSpatialScene: vi.fn().mockImplementation(() => ({
      execute: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

describe('injectScenePolyfill should call xrCurrentSceneDefaults and update scene config', () => {
  beforeEach(() => {
    ;(window as any).opener = {}
  })

  it('with no type', async () => {
    vi.useFakeTimers()

    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })
    window.xrCurrentSceneDefaults = mockFn

    injectSceneHook()

    document.dispatchEvent(new Event('DOMContentLoaded'))

    await vi.runAllTimersAsync()

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSize: { width: 1280, height: 720 } }),
    )

    // verify UpdateSceneConfig.execute
    const { UpdateSceneConfig } = await import('./JSBCommand')
    expect(UpdateSceneConfig).toHaveBeenCalledWith({
      type: 'window',
      defaultSize: { width: 800, height: 600 },
    })
  })

  it('with window type', async () => {
    vi.useFakeTimers()

    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })
    window.xrCurrentSceneDefaults = mockFn
    window.xrCurrentSceneType = 'window'

    injectSceneHook()

    document.dispatchEvent(new Event('DOMContentLoaded'))

    await vi.runAllTimersAsync()

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSize: { width: 1280, height: 720 } }),
    )

    // verify UpdateSceneConfig.execute
    const { UpdateSceneConfig } = await import('./JSBCommand')
    expect(UpdateSceneConfig).toHaveBeenCalledWith({
      type: 'window',
      defaultSize: { width: 800, height: 600 },
    })
  })

  it('with volume type', async () => {
    vi.useFakeTimers()

    const mockFn = vi.fn().mockResolvedValue({
      defaultSize: { width: 1, height: 1, depth: 1 },
      resizability: {
        minWidth: 0.5,
        minHeight: 1,
        maxWidth: 0.5,
        maxHeight: 1,
      },
    })
    window.xrCurrentSceneDefaults = mockFn
    window.xrCurrentSceneType = 'volume'

    injectSceneHook()

    document.dispatchEvent(new Event('DOMContentLoaded'))

    await vi.runAllTimersAsync()

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSize: { width: '0.94m', height: '0.94m', depth: '0.94m' },
      }),
    )

    // verify UpdateSceneConfig.execute
    const { UpdateSceneConfig } = await import('./JSBCommand')
    expect(UpdateSceneConfig).toHaveBeenCalledWith({
      type: 'volume',
      defaultSize: {
        width: pointToPhysical(1),
        height: pointToPhysical(1),
        depth: pointToPhysical(1),
      },
      resizability: {
        minWidth: 0.5,
        minHeight: 1,
        maxWidth: 0.5,
        maxHeight: 1,
      },
    })
  })
})

describe('initScene should receive defaultScene config by type', () => {
  it('with no type', async () => {
    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })

    initScene('sa-no-type', mockFn)

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSize: { width: 1280, height: 720 } }),
    )
  })

  it('with window type', async () => {
    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })

    initScene('sa-window', mockFn, { type: 'window' })

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSize: { width: 1280, height: 720 } }),
    )
  })

  it('with volume type', async () => {
    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })

    initScene('sa-volume', mockFn, { type: 'volume' })

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSize: { width: '0.94m', height: '0.94m', depth: '0.94m' },
      }),
    )
  })

  it('with volume type and merge pre', () => {
    const cb = vi.fn().mockImplementation(pre => ({
      ...pre,
      defaultSize: { ...(pre.defaultSize as any), depth: '0.1m' },
    }))

    // pre-snapshot should be empty before initScene writes configMap
    const preSnap = __getSceneConfigSnapshotForTest('sa')
    expect(preSnap).toBeUndefined()

    initScene('sa', cb, { type: 'volume' })

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSize: { width: '0.94m', height: '0.94m', depth: '0.94m' },
      }),
    )

    const snap = __getSceneConfigSnapshotForTest('sa')
    expect(snap).toEqual(
      expect.objectContaining({
        type: 'volume',
        defaultSize: { width: 0.94, height: 0.94, depth: 0.1 },
      }),
    )
  })
})

describe('initScene callback chaining', () => {
  it('passes previous return value as next pre argument', () => {
    const firstReturn = { defaultSize: { width: 1000, height: 1000 } }
    const cb1 = vi.fn().mockReturnValue(firstReturn)
    initScene('sa-chain', cb1)
    expect(cb1).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSize: { width: 1280, height: 720 } }),
    )

    const cb2 = vi.fn().mockReturnValue({})
    initScene('sa-chain', cb2)
    expect(cb2).toHaveBeenCalledWith(firstReturn)
  })
})
