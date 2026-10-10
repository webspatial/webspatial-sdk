import React from 'react'
import { useSpatialMaterial } from '../hooks/useSpatialMaterial'
import type { PBRMaterialProps } from '../materialProps'

export type { PBRMaterialProps } from '../materialProps'

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
  useSpatialMaterial(id, options, (session, commandOptions) =>
    session.createPBRMaterial(commandOptions),
  )
  return null
}
