'use client'

import { ComponentType, ReactNode } from 'react'
import type { SpatialUnlitMaterialOptions } from '@webspatial/core-sdk'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

type SpatialImpl = ReturnType<typeof requireSpatialImpl>

/**
 * Factory for material / texture / asset facades. Fallback is `null` per
 * spec's per-component fallback table ("Unsupported HTML component
 * rendering" Scenario in runtime-capabilities + facade table).
 *
 * **PARITY (spec tasks.md §15.6)**: this Path 1 fallback is pinned by
 * `runtime-capabilities` "Unsupported HTML component rendering"
 * Scenario. Real-impl Path 2 alignment for materials / textures / assets
 * is tracked under §15.8 (see `src/__tests__/parity.test.tsx`
 * "Material / Texture / *Asset parity" `it.todo`). Do not modify this
 * Path 1 `null` fallback without first aligning the real-impl branch.
 */
function createNullFacade<P>(
  componentName: string,
  pickReal: (impl: SpatialImpl) => unknown,
) {
  function Facade(props: P) {
    const ready = useSpatialReady()
    if (!ready) {
      warnBootForgotten(componentName)
      return null
    }
    const RealComponent = pickReal(requireSpatialImpl()) as ComponentType<any>
    return <RealComponent {...(props as any)} />
  }
  Facade.displayName = componentName
  return Facade
}

export type UnlitMaterialProps = {
  children?: ReactNode
  id: string
} & SpatialUnlitMaterialOptions

export type MaterialProps = { type: 'unlit' } & UnlitMaterialProps

export type TextureProps = {
  children?: ReactNode
  id: string
  url: string
  onLoad?: () => void
  onError?: (error: unknown) => void
}

export type ModelAssetProps = {
  children?: ReactNode
  id: string
  src: string
  onLoad?: () => void
  onError?: (error: unknown) => void
}

export type AttachmentAssetProps = {
  id: string
  children?: ReactNode
}

// `/* @__PURE__ */` annotations on the factory calls so the consumer
// bundler tree-shakes unused asset / material facades and the
// spatial-lazy-load §9.6 lint accepts them as module-private pure
// initialization.
export const UnlitMaterial =
  /* @__PURE__ */ createNullFacade<UnlitMaterialProps>(
    'UnlitMaterial',
    impl => impl.UnlitMaterial,
  )

export const Material = /* @__PURE__ */ createNullFacade<MaterialProps>(
  'Material',
  impl => impl.Material,
)

export const Texture = /* @__PURE__ */ createNullFacade<TextureProps>(
  'Texture',
  impl => impl.Texture,
)

export const ModelAsset = /* @__PURE__ */ createNullFacade<ModelAssetProps>(
  'ModelAsset',
  impl => impl.ModelAsset,
)

export const AttachmentAsset =
  /* @__PURE__ */ createNullFacade<AttachmentAssetProps>(
    'AttachmentAsset',
    impl => impl.AttachmentAsset,
  )
