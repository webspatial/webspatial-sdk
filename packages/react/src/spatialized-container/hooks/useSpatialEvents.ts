import { RefObject } from 'react'
import { SpatialContainerRefProxy } from './useDomProxy'
import { SpatialTapEvent } from '../types'
import { SpatializedContainerObject } from '../context/SpatializedContainerContext'

interface SpatialEvents {
  onSpatialTap?: (event: SpatialTapEvent) => void
}

export function useSpatialEvents(
  spatialEvents: SpatialEvents,
  spatialContainerRefProxy: RefObject<SpatialContainerRefProxy>,
) {
  const onSpatialTap = spatialEvents.onSpatialTap
    ? (event: SpatialTapEvent) => {
        console.log('onSpatialTap', event)
        const proxyEvent = new Proxy(event, {
          get(target, prop) {
            if (prop === 'currentTarget') {
              return spatialContainerRefProxy.current?.domProxy!
            }
            if (prop === 'isTrusted') {
              return true
            }
            return Reflect.get(target, prop)
          },
        })

        spatialEvents.onSpatialTap?.(proxyEvent)
      }
    : undefined

  return { onSpatialTap }
}

export function useSpatialEventsWhenSpatializedContainerExist(
  spatialEvents: SpatialEvents,
  spatialId: string,
  spatializedContainerObject: SpatializedContainerObject,
) {
  const onSpatialTap = spatialEvents.onSpatialTap
    ? (event: SpatialTapEvent) => {
        console.log('onSpatialTap', event)
        const proxyEvent = new Proxy(event, {
          get(target, prop) {
            if (prop === 'currentTarget') {
              const spatialContainerRefProxy =
                spatializedContainerObject.getSpatialContainerRefProxyBySpatialId(
                  spatialId,
                )
              return spatialContainerRefProxy?.domProxy!
            }
            if (prop === 'isTrusted') {
              return true
            }
            return Reflect.get(target, prop)
          },
        })

        spatialEvents.onSpatialTap?.(proxyEvent)
      }
    : undefined

  return { onSpatialTap }
}
