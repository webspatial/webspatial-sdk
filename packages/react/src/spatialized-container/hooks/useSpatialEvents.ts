import { RefObject } from 'react'
import { SpatialContainerRefProxy } from './useDomProxy'
import {
  SpatialDragEndEvent,
  SpatialDragEvent,
  SpatialRotateEvent,
  SpatialTapEvent,
  SpatializedElementRef,
  SpatialRotateEndEvent,
  SpatialMagnifyEndEvent,
  SpatialMagnifyEvent,
  SpatialRotateStartEvent,
} from '../types'
import { SpatializedContainerObject } from '../context/SpatializedContainerContext'

export interface SpatialEvents {
  onSpatialTap?: (event: SpatialTapEvent) => void
  onSpatialDragStart?: (event: SpatialDragEvent) => void
  onSpatialDrag?: (event: SpatialDragEvent) => void
  onSpatialDragEnd?: (event: SpatialDragEndEvent) => void
  onSpatialRotateStart?: (event: SpatialRotateStartEvent) => void
  onSpatialRotate?: (event: SpatialRotateEvent) => void
  onSpatialRotateEnd?: (event: SpatialRotateEndEvent) => void
  onSpatialMagnify?: (event: SpatialMagnifyEvent) => void
  onSpatialMagnifyEnd?: (event: SpatialMagnifyEndEvent) => void
}

// Create a generic event proxy factory function
function createEventProxy<T extends { currentTarget?: any }>(
  event: T,
  currentTargetGetter: () => SpatializedElementRef,
): T {
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
  currentTargetGetter: () => SpatializedElementRef,
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

  const onSpatialDragEnd = createEventHandler<SpatialDragEndEvent>(
    spatialEvents.onSpatialDragEnd,
    currentTargetGetter,
  )

  const onSpatialRotate = createEventHandler<SpatialRotateEvent>(
    spatialEvents.onSpatialRotate,
    currentTargetGetter,
  )

  const onSpatialRotateEnd = createEventHandler<SpatialRotateEndEvent>(
    spatialEvents.onSpatialRotateEnd,
    currentTargetGetter,
  )

  const onSpatialMagnify = createEventHandler<SpatialMagnifyEvent>(
    spatialEvents.onSpatialMagnify,
    currentTargetGetter,
  )

  const onSpatialMagnifyEnd = createEventHandler<SpatialMagnifyEndEvent>(
    spatialEvents.onSpatialMagnifyEnd,
    currentTargetGetter,
  )

  const onSpatialDragStart = createEventHandler<SpatialDragEvent>(
    spatialEvents.onSpatialDragStart,
    currentTargetGetter,
  )

  const onSpatialRotateStart = createEventHandler<SpatialRotateStartEvent>(
    spatialEvents.onSpatialRotateStart,
    currentTargetGetter,
  )

  return {
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotateStart,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
  }
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
