/* @vitest-environment jsdom */

import React, { type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type {
  SpatialMaterial,
  SpatialPBRMaterialOptions,
  SpatialSession,
} from '@webspatial/core-sdk'
import { RealityContext } from '../context/RealityContext'
import { useSpatialMaterial } from './useSpatialMaterial'

const PBR_OPTION_KEYS = [
  'color',
  'textureId',
  'metalness',
  'roughness',
  'transparent',
  'opacity',
] as const satisfies readonly (keyof SpatialPBRMaterialOptions)[]

type CreatePBR = (
  session: SpatialSession,
  options: Partial<SpatialPBRMaterialOptions>,
) => Promise<SpatialMaterial>

function makeMaterial() {
  const updateProperties = vi.fn(
    async (_properties: Partial<SpatialPBRMaterialOptions>) => ({
      success: true,
      data: {},
      errorCode: '',
      errorMessage: '',
    }),
  )
  const material = {
    id: 'native-pbr-1',
    type: 'pbr' as const,
    updateProperties,
    destroy: vi.fn(async () => {}),
    isDestroyed: false,
    inspect: vi.fn(),
    onDestroy: vi.fn(),
  } as unknown as SpatialMaterial
  return { material, updateProperties }
}

describe('useSpatialMaterial', () => {
  it('creates with defined fields only and preserves explicit zero metalness', async () => {
    const { material } = makeMaterial()
    const create = vi.fn<CreatePBR>(async () => material)
    const resourceRegistry = {
      subscribe: vi.fn(() => () => {}),
      has: vi.fn(() => false),
      get: vi.fn(),
      add: vi.fn(),
      removeAndDestroy: vi.fn(),
    }
    const session = {} as SpatialSession
    const ctx = {
      session,
      reality: { id: 'reality-1' },
      resourceRegistry,
      attachmentRegistry: {},
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <RealityContext.Provider value={ctx as never}>
        {children}
      </RealityContext.Provider>
    )

    const options: SpatialPBRMaterialOptions = {
      color: '#c0c0c0',
      metalness: 0,
    }

    renderHook(
      () => useSpatialMaterial('car', options, PBR_OPTION_KEYS, create),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1)
    })

    expect(create).toHaveBeenCalledWith(session, {
      color: '#c0c0c0',
      metalness: 0,
      textureId: undefined,
    })
    const payload = create.mock.calls[0][1]
    expect(payload).not.toHaveProperty('roughness')
    expect(payload).not.toHaveProperty('transparent')
    expect(payload).not.toHaveProperty('opacity')
    expect(resourceRegistry.add).toHaveBeenCalledWith(
      'car',
      expect.any(Promise),
    )
  })

  it('updates with defined fields only when props change', async () => {
    const { material, updateProperties } = makeMaterial()
    const create = vi.fn<CreatePBR>(async () => material)
    const resourceRegistry = {
      subscribe: vi.fn(() => () => {}),
      has: vi.fn(() => false),
      get: vi.fn(),
      add: vi.fn(),
      removeAndDestroy: vi.fn(),
    }
    const ctx = {
      session: {} as SpatialSession,
      reality: { id: 'reality-1' },
      resourceRegistry,
      attachmentRegistry: {},
    }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RealityContext.Provider value={ctx as never}>
        {children}
      </RealityContext.Provider>
    )

    const initialProps: SpatialPBRMaterialOptions = {
      color: '#fff',
      metalness: 0,
    }

    const { rerender } = renderHook(
      (props: SpatialPBRMaterialOptions) =>
        useSpatialMaterial('car', props, PBR_OPTION_KEYS, create),
      {
        wrapper,
        initialProps,
      },
    )

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(1)
    })

    const nextProps: SpatialPBRMaterialOptions = {
      color: '#3a8bff',
      metalness: 0,
      roughness: 0.2,
    }
    await act(async () => {
      rerender(nextProps)
    })

    await waitFor(() => {
      expect(updateProperties).toHaveBeenCalled()
    })

    const updates = updateProperties.mock.calls.at(-1)?.[0]
    expect(updates).toEqual({
      color: '#3a8bff',
      metalness: 0,
      roughness: 0.2,
    })
    expect(updates).not.toHaveProperty('textureId')
    expect(updates).not.toHaveProperty('transparent')
    expect(updates).not.toHaveProperty('opacity')
  })
})
