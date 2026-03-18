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
  const materialRef = useRef<SpatialUnlitMaterial>()
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      const materialPromise = session.createUnlitMaterial(options)
      resourceRegistry.add(options.id, materialPromise)
      try {
        const mat = await materialPromise
        materialRef.current = mat
        isInitializedRef.current = true
      } catch (error) {
        console.error(' ~ UnlitMaterial ~ error:', error)
      }
    }
    init()

    return () => {
      // Use registry to schedule destruction after promise resolves
      resourceRegistry.removeAndDestroy(options.id)
      materialRef.current = undefined
      isInitializedRef.current = false
    }
  }, [ctx])

  // Dynamic property updates
  useEffect(() => {
    if (!isInitializedRef.current || !materialRef.current) return
    const updates: Partial<SpatialUnlitMaterialOptions> = {}
    if (options.color !== undefined) updates.color = options.color
    if (options.transparent !== undefined)
      updates.transparent = options.transparent
    if (options.opacity !== undefined) updates.opacity = options.opacity
    if (Object.keys(updates).length > 0) {
      materialRef.current.updateProperties(updates)
    }
  }, [options.color, options.transparent, options.opacity])

  return null
}
