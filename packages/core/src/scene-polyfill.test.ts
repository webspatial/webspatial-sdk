import { describe, expect, test, vi, beforeEach, afterEach, it } from 'vitest'
import { formatSceneConfig, initScene, injectSceneHook } from './scene-polyfill'
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
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config, 'window')
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
    const formattedConfig = formatSceneConfig(config, 'window')
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
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config, 'window')
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
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config, 'volume')
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
    } satisfies SpatialSceneCreationOptions
    const formattedConfig = formatSceneConfig(config, 'volume')
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
    const formattedConfig = formatSceneConfig(config, 'volume')
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
        defaultSize: { width: 0.94, height: 0.94, depth: 0.94 },
      }),
    )

    // verify UpdateSceneConfig.execute
    const { UpdateSceneConfig } = await import('./JSBCommand')
    expect(UpdateSceneConfig).toHaveBeenCalledWith({
      type: 'volume',
      defaultSize: { width: 1, height: 1, depth: 1 },
      resizability: {
        minWidth: 0.5 * 1360,
        minHeight: 1 * 1360,
        maxWidth: 0.5 * 1360,
        maxHeight: 1 * 1360,
      },
    })
  })
})

describe('initScene should receive defaultScene config by type', () => {
  it('with no type', async () => {
    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })

    initScene('sa', mockFn)

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSize: { width: 1280, height: 720 } }),
    )
  })

  it('with window type', async () => {
    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })

    initScene('sa', mockFn, { type: 'window' })

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({ defaultSize: { width: 1280, height: 720 } }),
    )
  })

  it('with volume type', async () => {
    const mockFn = vi
      .fn()
      .mockResolvedValue({ defaultSize: { width: 800, height: 600 } })

    initScene('sa', mockFn, { type: 'volume' })

    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultSize: { width: 0.94, height: 0.94, depth: 0.94 },
      }),
    )
  })
})
