import React, { useEffect } from 'react'
import { EntityEventHandler } from '../type'
import { SpatialEntity } from '@webspatial/core-sdk'
import { createEntityRefProxy, EntityRef } from './useEntityRef'
import { useRealityContext } from '../context'
type Props = {
  instance: EntityRef
} & EntityEventHandler
export const useEntityEvent: React.FC<Props> = ({ instance, onSpatialTap }) => {
  useEffect(() => {
    const entity = instance.entity
    if (!entity) return

    if (onSpatialTap) {
      const handler = (ev: any) => {
        const proxied = new Proxy(ev, {
          get(target, prop: PropertyKey) {
            if (prop === 'target' || prop === 'currentTarget') {
              return instance
            }
            const val = (target as any)[prop]
            return typeof val === 'function' ? val.bind(target) : val
          },
        })
        onSpatialTap(proxied)
      }
      entity.addEvent('spatialtap', handler)
      return () => {
        entity.removeEvent('spatialtap')
      }
    }
  }, [instance.entity, onSpatialTap])

  return null
}
