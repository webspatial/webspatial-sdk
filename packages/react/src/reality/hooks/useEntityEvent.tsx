import React, { useEffect, useRef } from 'react'
import {
  EntityEventHandler,
  eventMap,
  SpatialDragStartEntityEvent,
  SpatialTapEntityEvent,
} from '../type'
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
      if (prop === 'bubbles') {
        return true
      }
      if (prop === 'offsetX') {
        const type = (target as any).type
        if (type === 'spatialtap') {
          return (target as SpatialTapEntityEvent).detail?.location3D?.x ?? 0
        }
        if (type === 'spatialdragstart') {
          return (
            (target as SpatialDragStartEntityEvent).detail?.startLocation3D
              ?.x ?? 0
          )
        }
        return undefined
      }
      if (prop === 'offsetY') {
        const type = (target as any).type
        if (type === 'spatialtap') {
          return (target as SpatialTapEntityEvent).detail?.location3D?.y ?? 0
        }
        if (type === 'spatialdragstart') {
          return (
            (target as SpatialDragStartEntityEvent).detail?.startLocation3D
              ?.y ?? 0
          )
        }
        return undefined
      }
      if (prop === 'offsetZ') {
        const type = (target as any).type
        if (type === 'spatialtap') {
          return (target as any).detail?.location3D?.z ?? 0
        }
        if (type === 'spatialdragstart') {
          return (target as any).detail?.startLocation3D?.z ?? 0
        }
        return undefined
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
  const eventsSetRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const entity = instance.entity
    if (!entity) return

    Object.entries(eventMap).forEach(([reactKey, spatialEvent]) => {
      //  add/update handler
      const handlerFn = (handlers as any)[reactKey]
      if (!handlerFn) return
      const wrapped = (ev: any) => handlerFn(createEventProxy(ev, instance))
      entity.addEvent(spatialEvent as any, wrapped)
      eventsSetRef.current.add(reactKey)
    })
    return () => {}
  }, [instance.entity, ...Object.values(handlers)])

  useEffect(() => {
    const entity = instance.entity
    if (!entity) return

    return () => {
      // remove all
      for (let x of eventsSetRef.current) {
        entity.removeEvent(x as any)
      }
      eventsSetRef.current.clear()
    }
  }, [instance.entity])

  return null
}
