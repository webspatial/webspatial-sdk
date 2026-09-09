import React from 'react'
import { useSpatialMaterial } from '../hooks/useSpatialMaterial'
import type { UnlitMaterialProps } from '../materialProps'

export type { UnlitMaterialProps } from '../materialProps'

/**
 * A flat-shaded material that ignores scene lighting.
 * Register it under `id`, then reference it from an entity's `materials` list.
 */
export const UnlitMaterial: React.FC<UnlitMaterialProps> = ({
  children,
  id,
  ...options
}) => {
  useSpatialMaterial(id, options, (session, commandOptions) =>
    session.createUnlitMaterial(commandOptions),
  )
  return null
}
