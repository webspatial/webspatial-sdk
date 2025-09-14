import React, { useEffect } from 'react'
import { EntityEventHandler } from '../type'
import { SpatialEntity } from '@webspatial/core-sdk'
type Props = {
  entity: SpatialEntity | null
} & EntityEventHandler
export const useEntityEvent: React.FC<Props> = ({ entity, onTap }) => {
  useEffect(() => {
    if (!entity) return
    if (onTap) {
      entity.addEvent('tap', onTap)
    }
    return () => {
      entity.removeEvent('tap')
    }
  }, [entity, onTap])

  return null
}
