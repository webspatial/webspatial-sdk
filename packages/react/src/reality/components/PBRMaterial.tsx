import React from 'react'
import {
  SpatialPBRMaterialOptions,
  SpatialPBRMaterial,
} from '@webspatial/core-sdk'
import { useSpatialMaterial } from '../hooks/useSpatialMaterial'

const PBR_OPTION_KEYS = [
  'color',
  'textureId',
  'metalness',
  'roughness',
  'transparent',
  'opacity',
] as const satisfies readonly (keyof SpatialPBRMaterialOptions)[]

export type PBRMaterialProps = {
  children?: React.ReactNode
  id: string // user id
} & SpatialPBRMaterialOptions

/**
 * A physically-based material that responds to scene lighting.
 *
 * `roughness` (0 = mirror smooth, 1 = fully rough) and `metalness`
 * (0 = dielectric, 1 = full metal) follow the same conventions as
 * Three.js `MeshStandardMaterial`. All props are reactive — changing
 * them after mount updates the material everywhere it is used.
 * See {@link MaterialPresets} for tuned starting points.
 */
export const PBRMaterial: React.FC<PBRMaterialProps> = ({
  children,
  id,
  ...options
}) => {
  useSpatialMaterial(
    id,
    options,
    PBR_OPTION_KEYS,
    (session, commandOptions): Promise<SpatialPBRMaterial> =>
      session.createPBRMaterial(commandOptions),
  )
  return null
}
