import React, { useEffect, useRef } from 'react'
import {
  SpatialUnlitMaterial,
  SpatialUnlitMaterialOptions,
} from '@webspatial/core-sdk'
import { useRealityContext } from '../context'
type Props = {
  children?: React.ReactNode
  id: string // user id
} & SpatialUnlitMaterialOptions
export const UnlitMaterial: React.FC<Props> = ({ children, ...options }) => {
  const ctx = useRealityContext()
  // const materialRef = useRef<SpatialUnlitMaterial>()
  useEffect(() => {
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      const material = await session.createUnlitMaterial(options)
      resourceRegistry.add(options.id, material)
      // todo: racing condition??
    }
    init()

    return () => {}
  }, [ctx])

  return null
}
