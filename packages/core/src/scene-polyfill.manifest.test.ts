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
        defaultSize: { width: '1000px', height: '300px' },
        resizability: expect.objectContaining({
          minWidth: '500px',
          minHeight: '400px',
          maxWidth: '1200px',
        }),
        worldAlignment: 'automatic',
        worldScaling: 'dynamic',
        baseplateVisibility: 'visible',
      }),
    )

    // volume remains from top-level only (no volume override) and formats:
    // - pre passed to initScene is the raw manifest values (unformatted)
    expect(volDefaults).toEqual(
      expect.objectContaining({
        defaultSize: {
          width: '200px',
          height: '300px',
          // depth may be omitted in manifest; defaults keep only provided keys
        },
        resizability: expect.objectContaining({
          minWidth: '300px',
          minHeight: '400px',
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
        defaultSize: { width: '2m', height: '2m', depth: '2m' },
        resizability: expect.objectContaining({
          minWidth: '1m',
        }),
        baseplateVisibility: 'automatic',
      }),
    )

    // window remains from top-level only (no window override)
    expect(winDefaults).toEqual(
      expect.objectContaining({
        defaultSize: { width: '120px', height: '240px' },
        resizability: expect.objectContaining({
          minWidth: '200px',
          minHeight: '300px',
        }),
      }),
    )

    cleanup()
  })

  it('applies provided mixed-case defaults and empty volume override; volume pre is formatted as expected', async () => {
    vi.resetModules()
    const cleanup = addDataManifest({
      xr_spatial_scene: {
        default_size: {
          width: '1024px',
          height: '1024px',
          depth: '55px',
        },
        resizability: {
          minWidth: '1024px',
          minHeight: '1024px',
          maxWidth: '2000px',
          maxHeight: '2000px',
        },
        worldScaling: 'automatic',
        worldAlignment: 'automatic',
        baseplateVisibility: 'visible',
        overrides: {
          window_scene: {
            default_size: {
              width: '500px',
              height: '500px',
              depth: '55px',
            },
            resizability: {
              minWidth: '500px',
              minHeight: '500px',
              maxWidth: '1000px',
              maxHeight: '1000px',
            },
          },
          volume_scene: {},
        },
      },
    })
    const { hijackWindowOpen, initScene } = await import('./scene-polyfill')
    hijackWindowOpen(window)
    await waitTick()

    const pxToM = (px: number) => px / 1360

    let volDefaults: any
    initScene(
      'sa',
      pre => {
        volDefaults = pre
        return { ...pre }
      },
      { type: 'volume' },
    )

    expect(volDefaults).toEqual(
      expect.objectContaining({
        defaultSize: {
          width: '1024px',
          height: '1024px',
          depth: '55px',
        },
        resizability: expect.objectContaining({
          minWidth: '1024px',
          minHeight: '1024px',
          maxWidth: '2000px',
          maxHeight: '2000px',
        }),
        worldScaling: 'automatic',
        worldAlignment: 'automatic',
        baseplateVisibility: 'visible',
      }),
    )

    // Snapshot current 'sa' internal config before cleanup
    const { __getSceneConfigSnapshotForTest } = await import('./scene-polyfill')
    const snap = __getSceneConfigSnapshotForTest('sa')
    expect(snap).toEqual(
      expect.objectContaining({
        type: 'volume',
        defaultSize: {
          width: pxToM(1024),
          height: pxToM(1024),
          depth: pxToM(55),
        },
        resizability: expect.objectContaining({
          minWidth: 1024,
          minHeight: 1024,
          maxWidth: 2000,
          maxHeight: 2000,
        }),
      }),
    )

    cleanup()
  })
})

describe('manifest error paths and empty configs', () => {
  function addInvalidDataManifest() {
    const link = document.createElement('link')
    link.rel = 'manifest'
    // Invalid JSON payload to force parse failure in getPWAManifest
    link.href = 'data:application/manifest+json,INVALID_JSON'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }

  it('falls back to built-in defaults when no manifest link is present', async () => {
    vi.resetModules()
    const { hijackWindowOpen, initScene } = await import('./scene-polyfill')
    hijackWindowOpen(window)
    await waitTick()

    let winPre: any
    initScene(
      'no-manifest-win',
      pre => {
        winPre = pre
        return pre
      },
      { type: 'window' },
    )
    let volPre: any
    initScene(
      'no-manifest-vol',
      pre => {
        volPre = pre
        return pre
      },
      { type: 'volume' },
    )

    // Window defaults: numbers in px domain for width/height
    expect(winPre).toEqual(
      expect.objectContaining({
        defaultSize: { width: 1280, height: 720 },
      }),
    )
    // Volume defaults: strings in meters for width/height/depth
    expect(volPre).toEqual(
      expect.objectContaining({
        defaultSize: { width: '0.94m', height: '0.94m', depth: '0.94m' },
      }),
    )
  })

  it('falls back to built-in defaults when manifest parsing fails', async () => {
    vi.resetModules()
    const cleanup = addInvalidDataManifest()
    const { hijackWindowOpen, initScene } = await import('./scene-polyfill')
    hijackWindowOpen(window)
    await waitTick()

    let winPre: any
    initScene(
      'bad-manifest-win',
      pre => {
        winPre = pre
        return pre
      },
      { type: 'window' },
    )
    let volPre: any
    initScene(
      'bad-manifest-vol',
      pre => {
        volPre = pre
        return pre
      },
      { type: 'volume' },
    )

    expect(winPre).toEqual(
      expect.objectContaining({
        defaultSize: { width: 1280, height: 720 },
      }),
    )
    expect(volPre).toEqual(
      expect.objectContaining({
        defaultSize: { width: '0.94m', height: '0.94m', depth: '0.94m' },
      }),
    )

    cleanup()
  })

  it('ignores empty xr_spatial_scene object and preserves built-in defaults', async () => {
    vi.resetModules()
    const cleanup = addDataManifest({
      xr_spatial_scene: {},
    })
    const { hijackWindowOpen, initScene } = await import('./scene-polyfill')
    hijackWindowOpen(window)
    await waitTick()

    let winPre: any
    initScene(
      'empty-xr-win',
      pre => {
        winPre = pre
        return pre
      },
      { type: 'window' },
    )
    let volPre: any
    initScene(
      'empty-xr-vol',
      pre => {
        volPre = pre
        return pre
      },
      { type: 'volume' },
    )

    expect(winPre).toEqual(
      expect.objectContaining({
        defaultSize: { width: 1280, height: 720 },
      }),
    )
    expect(volPre).toEqual(
      expect.objectContaining({
        defaultSize: { width: '0.94m', height: '0.94m', depth: '0.94m' },
      }),
    )

    cleanup()
  })
})
