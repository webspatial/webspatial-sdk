import React, { useEffect, useRef } from 'react'
import {
  SpatialUnlitMaterial,
  SpatialUnlitMaterialOptions,
} from '@webspatial/core-sdk'
import { useRealityContext } from '../context'
import { useWRM } from '../../wrm'

type Props = {
  children?: React.ReactNode
  id: string // user id
  textureUrl?: string // WRM texture support
} & SpatialUnlitMaterialOptions

export const UnlitMaterialWithWRM: React.FC<Props> = ({
  children,
  textureUrl,
  ...options
}) => {
  const ctx = useRealityContext()
  const { wrm } = useWRM()
  const materialRef = useRef<SpatialUnlitMaterial>()

  useEffect(() => {
    if (!ctx) return
    const { resourceRegistry } = ctx

    const init = async () => {
      try {
        // Create material options with texture URL if provided
        const materialOptions = {
          ...options,
          ...(textureUrl && { baseColorMap: textureUrl }),
        }

        // Use WRM for material creation
        const materialPromise = wrm.createMaterial(options.id, materialOptions)
        resourceRegistry.add(options.id, materialPromise)

        const mat = await materialPromise
        materialRef.current = mat
      } catch (error) {
        console.error(' ~ UnlitMaterialWithWRM ~ error:', error)
      }
    }

    init()

    return () => {
      resourceRegistry.removeAndDestroy(options.id)
      wrm.releaseResource(options.id)
    }
  }, [ctx, wrm, options.id, textureUrl])

  return null
}
