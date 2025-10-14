import React, { useEffect } from 'react'
import { EntityEventHandler } from '../type'
import { SpatialEntity } from '@webspatial/core-sdk'
type Props = {
  entity: SpatialEntity | null
} & EntityEventHandler
export const useEntityEvent: React.FC<Props> = ({ entity, onSpatialTap }) => {
  useEffect(() => {
    if (!entity) return
    if (onSpatialTap) {
      entity.addEvent('spatialtap', onSpatialTap)
    }
    return () => {
      entity.removeEvent('spatialtap')
    }
  }, [entity, onSpatialTap])

  return null
}
