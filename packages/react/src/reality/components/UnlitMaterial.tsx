import React from 'react'
import {
  SpatialUnlitMaterialOptions,
  SpatialUnlitMaterial,
} from '@webspatial/core-sdk'
import { useSpatialMaterial } from '../hooks/useSpatialMaterial'

const UNLIT_OPTION_KEYS = [
  'color',
  'textureId',
  'transparent',
  'opacity',
] as const satisfies readonly (keyof SpatialUnlitMaterialOptions)[]

export type UnlitMaterialProps = {
  children?: React.ReactNode
  id: string // user id
} & SpatialUnlitMaterialOptions

/**
 * A flat-shaded material that ignores scene lighting.
 * Register it under `id`, then reference it from an entity's `materials` list.
 */
export const UnlitMaterial: React.FC<UnlitMaterialProps> = ({
  children,
  id,
  ...options
}) => {
  useSpatialMaterial(
    id,
    options,
    UNLIT_OPTION_KEYS,
    (session, commandOptions): Promise<SpatialUnlitMaterial> =>
      session.createUnlitMaterial(commandOptions),
  )
  return null
}
