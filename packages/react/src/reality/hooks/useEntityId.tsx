import { SpatialEntity } from '@webspatial/core-sdk'
import React, { useEffect } from 'react'
import { useRealityContext } from '../context'
type Props = {
  id?: string
  entity?: SpatialEntity | null
}
export const useEntityId: React.FC<Props> = ({ id, entity }) => {
  const ctx = useRealityContext()
  useEffect(() => {
    if (!id || !entity || !ctx) return
    ctx.resourceRegistry.add('entity', id, Promise.resolve(entity))
    return () => {
      ctx.resourceRegistry.remove('entity', id)
    }
  }, [id, entity, ctx])

  return null
}
