import React, { useEffect } from 'react'
import { EntityEventHandler, eventMap } from '../type'
import { EntityRef } from './useEntityRef'
import { SpatialEntity } from '@webspatial/core-sdk'

function createEventProxy(ev: any, instance: EntityRef) {
  return new Proxy(ev, {
    get(target, prop: PropertyKey) {
      // Align with W3C: currentTarget is the listener owner
      if (prop === 'currentTarget') {
        return instance
      }
      // Align with W3C: target is the original dispatch target
      if (prop === 'target') {
        const origin = (target as any).__origin as SpatialEntity | undefined
        if (origin) {
          // Create a lightweight EntityRef for original target
          return new EntityRef(origin, null)
        }
        // Fallback: if origin not set, return current instance
        return instance
      }
      const val = (target as any)[prop]
      return typeof val === 'function' ? val.bind(target) : val
    },
  })
}

type Props = {
  instance: EntityRef
} & EntityEventHandler
export const useEntityEvent: React.FC<Props> = ({ instance, ...handlers }) => {
  useEffect(() => {
    const entity = instance.entity
    if (!entity) return

    const boundHandlers: (() => void)[] = []

    Object.entries(eventMap).forEach(([reactKey, spatialEvent]) => {
      const handlerFn = (handlers as any)[reactKey]
      if (!handlerFn) return

      const wrapped = (ev: any) => handlerFn(createEventProxy(ev, instance))
      entity.addEvent(spatialEvent as any, wrapped)
      boundHandlers.push(() => entity.removeEvent(spatialEvent as any))
    })
    return () => {
      boundHandlers.forEach(unbind => unbind())
    }
  }, [instance.entity, ...Object.values(handlers)])

  return null
}
