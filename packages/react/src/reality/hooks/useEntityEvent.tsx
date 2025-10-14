import React, { useEffect } from 'react'
import { EntityEventHandler } from '../type'
import { SpatialEntity } from '@webspatial/core-sdk'
import { createEntityRefProxy } from './useEntityRef'
import { useRealityContext } from '../context'
type Props = {
  entity: SpatialEntity | null
} & EntityEventHandler
export const useEntityEvent: React.FC<Props> = ({ entity, onSpatialTap }) => {
  const ctx = useRealityContext()
  useEffect(() => {
    if (!entity) return
    if (onSpatialTap) {
      const handler = (ev: any) => {
        const proxied = wrapEventWithEntityInstance(ev, entity, ctx)
        try {
          onSpatialTap(proxied)
        } catch (err) {
          console.error('error in onSpatialTap handler', err)
        }
      }
      entity.addEvent('spatialtap', handler)
      return () => {
        entity.removeEvent('spatialtap')
      }
    }
  }, [entity, onSpatialTap])

  return null
}

function wrapEventWithEntityInstance(
  originalEvent: any,
  entity: SpatialEntity | null,
  ctx: any,
) {
  const entityRefInstance = createEntityRefProxy(entity, ctx)

  const handler: ProxyHandler<any> = {
    get(target, prop: PropertyKey) {
      if (prop === 'target' || prop === 'currentTarget') {
        return entityRefInstance
      }
      const val = (target as any)[prop]
      if (typeof val === 'function') return val.bind(target)
      return val
    },
    set(target, prop, value) {
      try {
        ;(target as any)[prop] = value
        return true
      } catch {
        return true
      }
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)
      return Array.from(new Set([...keys, 'target', 'currentTarget']))
    },
    getOwnPropertyDescriptor(target, prop) {
      const desc = Object.getOwnPropertyDescriptor(target, prop as string)
      if (desc) return desc
      return {
        configurable: true,
        enumerable: true,
        writable: true,
        value: (handler.get as any)(target, prop),
      }
    },
  }

  return new Proxy(originalEvent, handler)
}
