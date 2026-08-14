/* @vitest-environment jsdom */

import React from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  SpatialModelAsset,
  SpatialModelEntity as CoreSpatialModelEntity,
} from '@webspatial/core-sdk'
import type { ModelAnimationClipData } from '@webspatial/core-sdk'

import { ModelAsset } from './ModelAsset'
import { ModelEntity } from './ModelEntity'
import { RealityContext } from '../context/RealityContext'
import { ParentContext } from '../context/ParentContext'
import type { ModelEntityRef } from '../hooks'

const CLIPS: ModelAnimationClipData[] = [
  { id: 'clip_0', name: 'Walk', duration: 2 },
  { id: 'clip_1', name: null, duration: 4 },
]

function makeCtx(overrides: Record<string, any> = {}) {
  return {
    session: {},
    reality: {
      id: 'reality-1',
      addEntity: vi.fn(async () => ({ success: true })),
    },
    resourceRegistry: {
      add: vi.fn(),
      remove: vi.fn(),
      get: vi.fn(),
      subscribe: vi.fn(() => () => {}),
    },
    ...overrides,
  } as any
}

/** Real core entity with the native bridge stubbed out. */
function makeCoreEntity(id: string, clips: ModelAnimationClipData[]) {
  const ent = new CoreSpatialModelEntity(id, {
    modelAssetId: 'asset-native-1',
    clips,
  })
  vi.spyOn(ent, 'updateTransform').mockResolvedValue({ success: true } as any)
  return ent
}

describe('ModelAsset onLoad', () => {
  it('passes the discovered clips to onLoad', async () => {
    const asset = new SpatialModelAsset('asset-native-1', { url: 'x' }, CLIPS)
    const onLoad = vi.fn()
    const ctx = makeCtx({
      session: { createModelAsset: vi.fn(async () => asset) },
    })

    render(
      <RealityContext.Provider value={ctx}>
        <ModelAsset id="model" src="/robot.usdz" onLoad={onLoad} />
      </RealityContext.Provider>,
    )
    await act(async () => {})

    expect(onLoad).toHaveBeenCalledWith({ animations: CLIPS })
  })

  it('reports an empty clip list for assets without animations', async () => {
    const asset = new SpatialModelAsset('asset-native-2', { url: 'x' })
    const onLoad = vi.fn()
    const ctx = makeCtx({
      session: { createModelAsset: vi.fn(async () => asset) },
    })

    render(
      <RealityContext.Provider value={ctx}>
        <ModelAsset id="model" src="/static.usdz" onLoad={onLoad} />
      </RealityContext.Provider>,
    )
    await act(async () => {})

    expect(onLoad).toHaveBeenCalledWith({ animations: [] })
  })

  it('still accepts a no-argument onLoad callback', async () => {
    const asset = new SpatialModelAsset('asset-native-3', { url: 'x' }, CLIPS)
    const onLoad: () => void = vi.fn()
    const ctx = makeCtx({
      session: { createModelAsset: vi.fn(async () => asset) },
    })

    render(
      <RealityContext.Provider value={ctx}>
        <ModelAsset id="model" src="/robot.usdz" onLoad={onLoad} />
      </RealityContext.Provider>,
    )
    await act(async () => {})

    expect(onLoad).toHaveBeenCalledTimes(1)
  })
})

describe('ModelEntity ref modelAnimation', () => {
  function renderModelEntity(
    coreEntity: CoreSpatialModelEntity,
    asset: SpatialModelAsset,
  ) {
    const createSpatialModelEntity = vi.fn(async () => coreEntity)
    const parent = {
      id: 'parent-1',
      addEntity: vi.fn(async () => ({ success: true })),
    } as any
    const ctx = makeCtx({
      session: { createSpatialModelEntity },
    })
    ctx.resourceRegistry.get.mockResolvedValue(asset)

    const ref = React.createRef<ModelEntityRef>()
    const view = render(
      <RealityContext.Provider value={ctx}>
        <ParentContext.Provider value={parent}>
          <ModelEntity ref={ref} id="modelEnt" model="model" />
        </ParentContext.Provider>
      </RealityContext.Provider>,
    )
    return { ref, view, createSpatialModelEntity }
  }

  it('seeds the entity with the asset clip catalog and exposes the controller', async () => {
    const asset = new SpatialModelAsset('asset-native-1', { url: 'x' }, CLIPS)
    const coreEntity = makeCoreEntity('ent-native-1', CLIPS)
    const { ref, createSpatialModelEntity } = renderModelEntity(
      coreEntity,
      asset,
    )
    await act(async () => {})

    expect(createSpatialModelEntity).toHaveBeenCalledWith(
      expect.objectContaining({ modelAssetId: 'asset-native-1', clips: CLIPS }),
      expect.anything(),
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current!.modelAnimation).toBe(coreEntity)
  })

  it('delegates playback control to the core entity', async () => {
    const asset = new SpatialModelAsset('asset-native-1', { url: 'x' }, CLIPS)
    const coreEntity = makeCoreEntity('ent-native-1', CLIPS)
    const { ref } = renderModelEntity(coreEntity, asset)
    await act(async () => {})

    const play = vi.spyOn(coreEntity, 'play').mockResolvedValue()
    const pause = vi.spyOn(coreEntity, 'pause').mockResolvedValue()
    const seek = vi.spyOn(coreEntity, 'seek').mockImplementation(() => {})
    const setRate = vi
      .spyOn(coreEntity, 'setPlaybackRate')
      .mockImplementation(() => {})

    const controller = ref.current!.modelAnimation
    await controller.play('clip_1', { loop: true })
    controller.pause()
    controller.seek(1.5)
    controller.setPlaybackRate(2)

    expect(play).toHaveBeenCalledWith('clip_1', { loop: true })
    expect(pause).toHaveBeenCalledTimes(1)
    expect(seek).toHaveBeenCalledWith(1.5)
    expect(setRate).toHaveBeenCalledWith(2)
  })

  it('drives two instances of one asset independently', async () => {
    const asset = new SpatialModelAsset('asset-native-1', { url: 'x' }, CLIPS)
    const entA = makeCoreEntity('ent-a', CLIPS)
    const entB = makeCoreEntity('ent-b', CLIPS)
    const createSpatialModelEntity = vi
      .fn()
      .mockResolvedValueOnce(entA)
      .mockResolvedValueOnce(entB)
    const parent = {
      id: 'parent-1',
      addEntity: vi.fn(async () => ({ success: true })),
    } as any
    const ctx = makeCtx({ session: { createSpatialModelEntity } })
    ctx.resourceRegistry.get.mockResolvedValue(asset)

    const refA = React.createRef<ModelEntityRef>()
    const refB = React.createRef<ModelEntityRef>()
    render(
      <RealityContext.Provider value={ctx}>
        <ParentContext.Provider value={parent}>
          <ModelEntity ref={refA} id="entA" model="model" />
          <ModelEntity ref={refB} id="entB" model="model" />
        </ParentContext.Provider>
      </RealityContext.Provider>,
    )
    await act(async () => {})

    expect(refA.current!.modelAnimation).not.toBe(refB.current!.modelAnimation)

    const playA = vi.spyOn(entA, 'play').mockResolvedValue()
    const playB = vi.spyOn(entB, 'play').mockResolvedValue()
    await refA.current!.modelAnimation.play('clip_0')
    expect(playA).toHaveBeenCalledTimes(1)
    expect(playB).not.toHaveBeenCalled()
  })

  it('throws when modelAnimation is read before the entity exists', () => {
    const asset = new SpatialModelAsset('asset-native-1', { url: 'x' }, CLIPS)
    const coreEntity = makeCoreEntity('ent-native-1', CLIPS)
    const { ref } = renderModelEntity(coreEntity, asset)

    // Entity creation is async; the imperative handle exists immediately but
    // the underlying entity does not.
    expect(ref.current).not.toBeNull()
    expect(() => ref.current!.modelAnimation).toThrow('Entity not ready')
  })
})
