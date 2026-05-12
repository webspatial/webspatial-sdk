'use client'

import { ComponentType, ReactNode } from 'react'
import type { SpatialUnlitMaterialOptions } from '@webspatial/core-sdk'
import { getSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

type SpatialImpl = NonNullable<ReturnType<typeof getSpatialImpl>>

/**
 * Factory for material / texture / asset facades. Fallback is `null` per
 * spec's per-component fallback table ("Unsupported HTML component
 * rendering" Scenario in runtime-capabilities + facade table).
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
    const RealComponent = pickReal(getSpatialImpl()!) as ComponentType<any>
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
  name: string
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
