import { describe, it, expect, vi } from 'vitest'

vi.mock('./JSBCommand', () => {
  return {
    createSpatialSceneCommand: vi.fn().mockImplementation(() => ({
      executeSync: vi.fn().mockReturnValue({
        data: { id: 'scene-1', windowProxy: {} },
      }),
    })),
    FocusScene: vi.fn().mockImplementation(() => ({
      execute: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

function addDataManifest(manifest: any) {
  const link = document.createElement('link')
  link.rel = 'manifest'
  const json = JSON.stringify(manifest)
  link.href = 'data:application/manifest+json,' + encodeURIComponent(json)
  document.head.appendChild(link)
  return () => {
    document.head.removeChild(link)
  }
}

async function waitTick() {
  await Promise.resolve()
  await new Promise(r => setTimeout(r, 0))
}

describe('setupManifest applies overrides to xr_window_defaults / xr_volume_defaults', () => {
  it('applies window overrides without affecting volume defaults', async () => {
    vi.resetModules()
    const cleanup = addDataManifest({
      xr_spatial_scene: {
        defaultSize: { width: '200px', height: '300px' },
        resizability: { minWidth: '300px', minHeight: '400px' },
        worldScaling: 'dynamic',
        worldAlignment: 'gravityAligned',
        baseplateVisibility: 'visible',
        overrides: {
          window_scene: {
            defaultSize: { width: '1000px' },
            resizability: { minWidth: '500px', maxWidth: '1200px' },
            worldAlignment: 'automatic',
          },
        },
      },
    })
    const { hijackWindowOpen, initScene } = await import('./scene-polyfill')
    hijackWindowOpen(window)
    await waitTick()

    let winDefaults: any
    initScene(
      'w',
      pre => {
        winDefaults = pre
        return pre
      },
      { type: 'window' },
    )

    let volDefaults: any
    initScene(
      'v',
      pre => {
        volDefaults = pre
        return pre
      },
      { type: 'volume' },
    )

    // window uses overrides + formatted to px
    expect(winDefaults).toEqual(
      expect.objectContaining({
        defaultSize: { width: 1000, height: 300 },
        resizability: expect.objectContaining({
          minWidth: 500,
          minHeight: 400,
          maxWidth: 1200,
        }),
        worldAlignment: 'automatic',
        worldScaling: 'dynamic',
        baseplateVisibility: 'visible',
      }),
    )

    // volume remains from top-level only (no volume override) and formats:
    // - defaultSize strings in px are converted to meters for volume defaults
    //   200px -> 200/1360, 300px -> 300/1360
    const pxToM = (px: number) => px / 1360
    expect(volDefaults).toEqual(
      expect.objectContaining({
        defaultSize: {
          width: pxToM(200),
          height: pxToM(300),
          // depth may be omitted in manifest; defaults keep only provided keys
        },
        resizability: expect.objectContaining({
          minWidth: 300, // resizability always formatted in px
          minHeight: 400,
        }),
        worldAlignment: 'gravityAligned',
        worldScaling: 'dynamic',
        baseplateVisibility: 'visible',
      }),
    )

    cleanup()
  })

  it('applies volume overrides without affecting window defaults', async () => {
    vi.resetModules()
    const cleanup = addDataManifest({
      xr_spatial_scene: {
        defaultSize: { width: '120px', height: '240px' },
        resizability: { minWidth: '200px', minHeight: '300px' },
        overrides: {
          volume_scene: {
            defaultSize: { width: '2m', height: '2m', depth: '2m' },
            resizability: { minWidth: '1m' },
            baseplateVisibility: 'automatic',
          },
        },
      },
    })
    const { hijackWindowOpen, initScene } = await import('./scene-polyfill')
    hijackWindowOpen(window)
    await waitTick()

    let volDefaults: any
    initScene(
      'v',
      pre => {
        volDefaults = pre
        return pre
      },
      { type: 'volume' },
    )
    let winDefaults: any
    initScene(
      'w',
      pre => {
        winDefaults = pre
        return pre
      },
      { type: 'window' },
    )

    // volume uses overrides + formatting (m for defaultSize, px for resizability)
    expect(volDefaults).toEqual(
      expect.objectContaining({
        defaultSize: { width: 2, height: 2, depth: 2 },
        resizability: expect.objectContaining({
          minWidth: 1360, // 1m -> 1360px
        }),
        baseplateVisibility: 'automatic',
      }),
    )

    // window remains from top-level only (no window override)
    expect(winDefaults).toEqual(
      expect.objectContaining({
        defaultSize: { width: 120, height: 240 },
        resizability: expect.objectContaining({
          minWidth: 200,
          minHeight: 300,
        }),
      }),
    )

    cleanup()
  })
})
