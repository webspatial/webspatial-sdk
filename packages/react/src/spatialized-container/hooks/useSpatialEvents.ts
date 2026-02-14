import { RefObject } from 'react'
import { SpatialContainerRefProxy } from './useDomProxy'
import {
  SpatializedElementRef,
  SpatialTapEvent,
  SpatialDragStartEvent,
  SpatialDragEndEvent,
  SpatialDragEvent,
  SpatialRotateEvent,
  SpatialRotateEndEvent,
  SpatialMagnifyEndEvent,
  SpatialMagnifyEvent,
} from '../types'
import { SpatializedContainerObject } from '../context/SpatializedContainerContext'

export interface SpatialEvents<
  T extends SpatializedElementRef = SpatializedElementRef,
> {
  onSpatialTap?: (event: SpatialTapEvent<T>) => void
  onSpatialDragStart?: (event: SpatialDragStartEvent<T>) => void
  onSpatialDrag?: (event: SpatialDragEvent<T>) => void
  onSpatialDragEnd?: (event: SpatialDragEndEvent<T>) => void
  onSpatialRotate?: (event: SpatialRotateEvent<T>) => void
  onSpatialRotateEnd?: (event: SpatialRotateEndEvent<T>) => void
  onSpatialMagnify?: (event: SpatialMagnifyEvent<T>) => void
  onSpatialMagnifyEnd?: (event: SpatialMagnifyEndEvent<T>) => void
}

function createEventProxy<
  T extends SpatializedElementRef,
  E extends { currentTarget: T },
>(
  event: E,
  currentTargetGetter: () => T,
  offsetXGetter?: (event: E) => number | undefined,
  offsetYGetter?: (event: E) => number | undefined,
  offsetZGetter?: (event: E) => number | undefined,
): E {
  return new Proxy(event, {
    get(target, prop) {
      if (prop === 'currentTarget') {
        return currentTargetGetter()
      }
      if (prop === 'isTrusted') {
        return true
      }
      if (prop === 'offsetX' && offsetXGetter) {
        return offsetXGetter(target) ?? 0
      }
      if (prop === 'offsetY' && offsetYGetter) {
        return offsetYGetter(target) ?? 0
      }
      if (prop === 'offsetZ' && offsetZGetter) {
        return offsetZGetter(target) ?? 0
      }
      return Reflect.get(target, prop)
    },
  })
}

function createEventHandler<
  T extends SpatializedElementRef,
  E extends { currentTarget: T },
>(
  handler: ((event: E) => void) | undefined,
  currentTargetGetter: () => T,
  offsetXGetter?: (event: E) => number | undefined,
  offsetYGetter?: (event: E) => number | undefined,
  offsetZGetter?: (event: E) => number | undefined,
): ((event: E) => void) | undefined {
  return handler
    ? (event: E) => {
        const proxyEvent = createEventProxy<T, E>(
          event,
          currentTargetGetter,
          offsetXGetter,
          offsetYGetter,
          offsetZGetter,
        )
        handler(proxyEvent)
      }
    : undefined
}

export function useSpatialEventsBase<T extends SpatializedElementRef>(
  spatialEvents: SpatialEvents<T>,
  currentTargetGetter: () => T,
) {
  const onSpatialTap = createEventHandler<T, SpatialTapEvent<T>>(
    spatialEvents.onSpatialTap,
    currentTargetGetter,
    (ev: any) => ev.detail?.location3D?.x,
    (ev: any) => ev.detail?.location3D?.y,
    (ev: any) => ev.detail?.location3D?.z,
  )

  const onSpatialDrag = createEventHandler<T, SpatialDragEvent<T>>(
    spatialEvents.onSpatialDrag,
    currentTargetGetter,
  )

  const onSpatialDragEnd = createEventHandler<T, SpatialDragEndEvent<T>>(
    spatialEvents.onSpatialDragEnd,
    currentTargetGetter,
  )

  const onSpatialRotate = createEventHandler<T, SpatialRotateEvent<T>>(
    spatialEvents.onSpatialRotate,
    currentTargetGetter,
  )

  const onSpatialRotateEnd = createEventHandler<T, SpatialRotateEndEvent<T>>(
    spatialEvents.onSpatialRotateEnd,
    currentTargetGetter,
  )

  const onSpatialMagnify = createEventHandler<T, SpatialMagnifyEvent<T>>(
    spatialEvents.onSpatialMagnify,
    currentTargetGetter,
  )

  const onSpatialMagnifyEnd = createEventHandler<T, SpatialMagnifyEndEvent<T>>(
    spatialEvents.onSpatialMagnifyEnd,
    currentTargetGetter,
  )

  const onSpatialDragStart = createEventHandler<T, SpatialDragStartEvent<T>>(
    spatialEvents.onSpatialDragStart,
    currentTargetGetter,
    (ev: any) => ev.detail?.startLocation3D?.x,
    (ev: any) => ev.detail?.startLocation3D?.y,
    (ev: any) => ev.detail?.startLocation3D?.z,
  )

  return {
    onSpatialTap,
    onSpatialDragStart,
    onSpatialDrag,
    onSpatialDragEnd,
    onSpatialRotate,
    onSpatialRotateEnd,
    onSpatialMagnify,
    onSpatialMagnifyEnd,
  }
}

export function useSpatialEvents<T extends SpatializedElementRef>(
  spatialEvents: SpatialEvents<T>,
  spatialContainerRefProxy: RefObject<SpatialContainerRefProxy<T>>,
) {
  return useSpatialEventsBase<T>(
    spatialEvents,
    () => spatialContainerRefProxy.current?.domProxy!,
  )
}

export function useSpatialEventsWhenSpatializedContainerExist<
  T extends SpatializedElementRef,
>(
  spatialEvents: SpatialEvents<T>,
  spatialId: string,
  spatializedContainerObject: SpatializedContainerObject<T>,
) {
  return useSpatialEventsBase<T>(spatialEvents, () => {
    const spatialContainerRefProxy =
      spatializedContainerObject.getSpatialContainerRefProxyBySpatialId(
        spatialId,
      )
    return spatialContainerRefProxy?.domProxy as T
  })
}
