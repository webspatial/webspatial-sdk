import { RefObject } from 'react'
import { SpatialContainerRefProxy } from './useDomProxy'
import {
  SpatialDragEvent,
  SpatialTapEvent,
  SpatializedElementRef,
} from '../types'
import { SpatializedContainerObject } from '../context/SpatializedContainerContext'

interface SpatialEvents {
  onSpatialTap?: (event: SpatialTapEvent) => void
  onSpatialDrag?: (event: SpatialDragEvent) => void
}

// Create a generic event proxy factory function
function createEventProxy<T extends { currentTarget?: any }>(event: T, currentTargetGetter: () => SpatializedElementRef): T {
  return new Proxy(event, {
    get(target, prop) {
      if (prop === 'currentTarget') {
        return currentTargetGetter()
      }
      if (prop === 'isTrusted') {
        return true
      }
      return Reflect.get(target, prop)
    },
  })
}

// Create an event handler factory function
function createEventHandler<T extends { currentTarget?: any }>(
  handler: ((event: T) => void) | undefined,
  currentTargetGetter: () => SpatializedElementRef
): ((event: T) => void) | undefined {
  return handler
    ? (event: T) => {
        const proxyEvent = createEventProxy(event, currentTargetGetter)
        handler(proxyEvent)
      }
    : undefined
}

export function useSpatialEventsBase(
  spatialEvents: SpatialEvents,
  currentTargetGetter: () => SpatializedElementRef,
) {
  const onSpatialTap = createEventHandler<SpatialTapEvent>(
    spatialEvents.onSpatialTap,
    currentTargetGetter,
  )

  const onSpatialDrag = createEventHandler<SpatialDragEvent>(
    spatialEvents.onSpatialDrag,
    currentTargetGetter,
  )

  return { onSpatialTap, onSpatialDrag }
}

export function useSpatialEvents(
  spatialEvents: SpatialEvents,
  spatialContainerRefProxy: RefObject<SpatialContainerRefProxy>,
) {
  return useSpatialEventsBase(
    spatialEvents,
    () => spatialContainerRefProxy.current?.domProxy!,
  )
}

export function useSpatialEventsWhenSpatializedContainerExist(
  spatialEvents: SpatialEvents,
  spatialId: string,
  spatializedContainerObject: SpatializedContainerObject,
) {
  return useSpatialEventsBase(spatialEvents, () => {
    const spatialContainerRefProxy =
      spatializedContainerObject.getSpatialContainerRefProxyBySpatialId(
        spatialId,
      )
    return spatialContainerRefProxy?.domProxy!
  })
}
