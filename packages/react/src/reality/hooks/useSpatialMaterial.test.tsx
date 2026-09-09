/* @vitest-environment jsdom */

import React, { type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  SpatialMaterial,
  SpatialObject,
  type SpatialPBRMaterialOptions,
  type SpatialSession,
} from '@webspatial/core-sdk'
import { RealityContext, type RealityContextValue } from '../context'
import { AttachmentRegistry } from '../context/AttachmentContext'
import { ResourceRegistry } from '../utils/ResourceRegistry'
import { useSpatialMaterial } from './useSpatialMaterial'

type CreateMaterial = (
  session: SpatialSession,
  options: SpatialPBRMaterialOptions,
) => Promise<SpatialMaterial<SpatialPBRMaterialOptions>>

class TestMaterial extends SpatialMaterial<SpatialPBRMaterialOptions> {
  readonly updateProperties = vi.fn(
    async (_properties: SpatialPBRMaterialOptions) => okResult(),
  )

  constructor(id = 'native-mat-1') {
    super(id, 'pbr')
  }

  override async destroy() {
    this.isDestroyed = true
  }
}

class TestTexture extends SpatialObject {
  constructor(id = 'native-tex-1') {
    super(id)
  }

  override async destroy() {
    this.isDestroyed = true
  }
}

function okResult(): {
  success: boolean
  data: Record<string, never>
  errorCode: string | undefined
  errorMessage: string | undefined
} {
  return {
    success: true,
    data: {},
    errorCode: undefined,
    errorMessage: undefined,
  }
}

function makeContext(): {
  ctx: NonNullable<RealityContextValue>
  wrapper: ({ children }: { children: ReactNode }) => React.JSX.Element
} {
  const ctx: NonNullable<RealityContextValue> = {
    session: { id: 'session-1' } as unknown as SpatialSession,
    reality: { id: 'reality-1' } as NonNullable<RealityContextValue>['reality'],
    resourceRegistry: new ResourceRegistry(),
    attachmentRegistry: new AttachmentRegistry(),
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RealityContext.Provider value={ctx}>{children}</RealityContext.Provider>
  )
  return { ctx, wrapper }
}

describe('useSpatialMaterial', () => {
  it('creates with defined fields only and preserves explicit zero metalness', async () => {
    const material = new TestMaterial()
    const create = vi.fn<CreateMaterial>(async () => material)
    const { ctx, wrapper } = makeContext()
    const add = vi.spyOn(ctx.resourceRegistry, 'add')

    renderHook(
      () =>
        useSpatialMaterial('car', { color: '#c0c0c0', metalness: 0 }, create),
      { wrapper },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1)
    })

    expect(create).toHaveBeenCalledWith(ctx.session, {
      color: '#c0c0c0',
      metalness: 0,
    })
    const payload = create.mock.calls[0][1]
    expect(payload).not.toHaveProperty('textureId')
    expect(payload).not.toHaveProperty('roughness')
    expect(payload).not.toHaveProperty('transparent')
    expect(payload).not.toHaveProperty('opacity')
    expect(add).toHaveBeenCalledWith('car', expect.any(Promise))
  })

  it('updates with defined fields only when props change', async () => {
    const material = new TestMaterial()
    const create = vi.fn<CreateMaterial>(async () => material)
    const { wrapper } = makeContext()

    const { rerender } = renderHook(
      (props: SpatialPBRMaterialOptions) =>
        useSpatialMaterial('car', props, create),
      {
        wrapper,
        initialProps: {
          color: '#fff',
          metalness: 0,
        } as SpatialPBRMaterialOptions,
      },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      rerender({ color: '#3a8bff', metalness: 0, roughness: 0.2 })
    })

    await waitFor(() => {
      expect(material.updateProperties).toHaveBeenCalled()
    })

    const updates = material.updateProperties.mock.calls.at(-1)?.[0]
    expect(updates).toEqual({
      color: '#3a8bff',
      metalness: 0,
      roughness: 0.2,
    })
    expect(updates).not.toHaveProperty('textureId')
    expect(updates).not.toHaveProperty('transparent')
    expect(updates).not.toHaveProperty('opacity')
  })

  it('destroys a still-pending create on unmount', async () => {
    let resolveCreate!: (material: TestMaterial) => void
    const material = new TestMaterial()
    const create = vi.fn<CreateMaterial>(
      () =>
        new Promise<TestMaterial>(resolve => {
          resolveCreate = resolve
        }),
    )
    const { ctx, wrapper } = makeContext()
    const removeAndDestroy = vi.spyOn(ctx.resourceRegistry, 'removeAndDestroy')

    const { unmount } = renderHook(
      () => useSpatialMaterial('car', { color: '#fff' }, create),
      { wrapper },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1)
    })

    unmount()
    expect(removeAndDestroy).toHaveBeenCalledWith('car')

    await act(async () => {
      resolveCreate(material)
    })
    await waitFor(() => {
      expect(material.isDestroyed).toBe(true)
    })
  })

  it('creates tint-only while a texture is missing, then binds the native id', async () => {
    const material = new TestMaterial()
    const create = vi.fn<CreateMaterial>(async () => material)
    const { ctx, wrapper } = makeContext()

    renderHook(
      () =>
        useSpatialMaterial('car', { color: '#fff', textureId: 'grid' }, create),
      { wrapper },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        ctx.session,
        expect.objectContaining({ textureId: '' }),
      )
    })

    await act(async () => {
      ctx.resourceRegistry.add(
        'grid',
        Promise.resolve(new TestTexture('native-tex-1')),
      )
    })

    await waitFor(() => {
      expect(material.updateProperties).toHaveBeenCalledWith(
        expect.objectContaining({ textureId: 'native-tex-1' }),
      )
    })
  })

  it('falls back to an empty texture id when texture load fails', async () => {
    const material = new TestMaterial()
    const create = vi.fn<CreateMaterial>(async () => material)
    const { ctx, wrapper } = makeContext()
    ctx.resourceRegistry.add('grid', Promise.reject(new Error('decode failed')))

    renderHook(
      () =>
        useSpatialMaterial('car', { color: '#fff', textureId: 'grid' }, create),
      { wrapper },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        ctx.session,
        expect.objectContaining({ textureId: '' }),
      )
    })
  })

  it('clears the bound texture when textureId is replaced with empty string', async () => {
    const material = new TestMaterial()
    const create = vi.fn<CreateMaterial>(async () => material)
    const { ctx, wrapper } = makeContext()
    ctx.resourceRegistry.add(
      'grid',
      Promise.resolve(new TestTexture('native-tex-1')),
    )

    const { rerender } = renderHook(
      (props: SpatialPBRMaterialOptions) =>
        useSpatialMaterial('car', props, create),
      {
        wrapper,
        initialProps: { color: '#fff', textureId: 'grid' },
      },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        ctx.session,
        expect.objectContaining({ textureId: 'native-tex-1' }),
      )
    })

    await act(async () => {
      rerender({ color: '#fff', textureId: '' })
    })

    await waitFor(() => {
      expect(material.updateProperties).toHaveBeenCalledWith(
        expect.objectContaining({ textureId: '' }),
      )
    })
  })

  it('destroys the previous material when the id changes', async () => {
    const first = new TestMaterial('native-a')
    const second = new TestMaterial('native-b')
    const create = vi
      .fn<CreateMaterial>()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
    const { ctx, wrapper } = makeContext()
    const removeAndDestroy = vi.spyOn(ctx.resourceRegistry, 'removeAndDestroy')

    const { rerender } = renderHook(
      ({ id }: { id: string }) =>
        useSpatialMaterial(id, { color: '#fff' }, create),
      { wrapper, initialProps: { id: 'car' } },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      rerender({ id: 'hood' })
    })

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(2)
    })
    expect(removeAndDestroy).toHaveBeenCalledWith('car')
    expect(ctx.resourceRegistry.has('hood')).toBe(true)
  })

  it('reports a failed update with the material id', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const material = new TestMaterial()
    material.updateProperties.mockResolvedValue({
      success: false,
      data: {},
      errorCode: 'JSB',
      errorMessage: 'native reject',
    })
    const create = vi.fn<CreateMaterial>(async () => material)
    const { wrapper } = makeContext()

    const { rerender } = renderHook(
      (props: SpatialPBRMaterialOptions) =>
        useSpatialMaterial('car', props, create),
      { wrapper, initialProps: { color: '#fff' } },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      rerender({ color: '#000' })
    })

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        ' ~ Material "car" ~ update failed:',
        'native reject',
      )
    })
    errorSpy.mockRestore()
  })
})
