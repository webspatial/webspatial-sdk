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
  clientXGetter?: (event: E) => number | undefined,
  clientYGetter?: (event: E) => number | undefined,
  clientZGetter?: (event: E) => number | undefined,
  translationXGetter?: (event: E) => number | undefined,
  translationYGetter?: (event: E) => number | undefined,
  translationZGetter?: (event: E) => number | undefined,
  quaternionGetter?: (
    event: E,
  ) => import('@webspatial/core-sdk').Quaternion | undefined,
  magnificationGetter?: (event: E) => number | undefined,
): E {
  return new Proxy(event, {
    get(target, prop) {
      if (prop === 'currentTarget') {
        return currentTargetGetter()
      }
      if (prop === 'isTrusted') {
        return true
      }
      if (prop === 'bubbles') {
        return false
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
      if (prop === 'clientX' && clientXGetter) {
        return clientXGetter(target) ?? 0
      }
      if (prop === 'clientY' && clientYGetter) {
        return clientYGetter(target) ?? 0
      }
      if (prop === 'clientZ' && clientZGetter) {
        return clientZGetter(target) ?? 0
      }
      if (prop === 'translationX' && translationXGetter) {
        return translationXGetter(target) ?? 0
      }
      if (prop === 'translationY' && translationYGetter) {
        return translationYGetter(target) ?? 0
      }
      if (prop === 'translationZ' && translationZGetter) {
        return translationZGetter(target) ?? 0
      }
      if (prop === 'quaternion' && quaternionGetter) {
        return quaternionGetter(target) ?? { x: 0, y: 0, z: 0, w: 1 }
      }
      if (prop === 'magnification' && magnificationGetter) {
        return magnificationGetter(target) ?? 1
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
  clientXGetter?: (event: E) => number | undefined,
  clientYGetter?: (event: E) => number | undefined,
  clientZGetter?: (event: E) => number | undefined,
  translationXGetter?: (event: E) => number | undefined,
  translationYGetter?: (event: E) => number | undefined,
  translationZGetter?: (event: E) => number | undefined,
  quaternionGetter?: (
    event: E,
  ) => import('@webspatial/core-sdk').Quaternion | undefined,
  magnificationGetter?: (event: E) => number | undefined,
): ((event: E) => void) | undefined {
  return handler
    ? (event: E) => {
        const proxyEvent = createEventProxy<T, E>(
          event,
          currentTargetGetter,
          offsetXGetter,
          offsetYGetter,
          offsetZGetter,
          clientXGetter,
          clientYGetter,
          clientZGetter,
          translationXGetter,
          translationYGetter,
          translationZGetter,
          quaternionGetter,
          magnificationGetter,
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
    // offsetX/Y/Z come from local coordinates
    (ev: SpatialTapEvent<T>) => ev.detail?.location3D?.x,
    (ev: SpatialTapEvent<T>) => ev.detail?.location3D?.y,
    (ev: SpatialTapEvent<T>) => ev.detail?.location3D?.z,
    // clientX/Y/Z come from global scene coordinates
    (ev: SpatialTapEvent<T>) => ev.detail?.globalLocation3D?.x,
    (ev: SpatialTapEvent<T>) => ev.detail?.globalLocation3D?.y,
    (ev: SpatialTapEvent<T>) => ev.detail?.globalLocation3D?.z,
  )
  const onSpatialDrag = createEventHandler<T, SpatialDragEvent<T>>(
    spatialEvents.onSpatialDrag,
    currentTargetGetter,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    (ev: SpatialDragEvent<T>) => ev.detail?.translation3D?.x,
    (ev: SpatialDragEvent<T>) => ev.detail?.translation3D?.y,
    (ev: SpatialDragEvent<T>) => ev.detail?.translation3D?.z,
  )

  const onSpatialDragEnd = createEventHandler<T, SpatialDragEndEvent<T>>(
    spatialEvents.onSpatialDragEnd,
    currentTargetGetter,
  )

  const onSpatialRotate = createEventHandler<T, SpatialRotateEvent<T>>(
    spatialEvents.onSpatialRotate,
    currentTargetGetter,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    (ev: SpatialRotateEvent<T>) => ev.detail?.quaternion,
  )

  const onSpatialRotateEnd = createEventHandler<T, SpatialRotateEndEvent<T>>(
    spatialEvents.onSpatialRotateEnd,
    currentTargetGetter,
  )

  const onSpatialMagnify = createEventHandler<T, SpatialMagnifyEvent<T>>(
    spatialEvents.onSpatialMagnify,
    currentTargetGetter,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    (ev: SpatialMagnifyEvent<T>) => ev.detail?.magnification,
  )

  const onSpatialMagnifyEnd = createEventHandler<T, SpatialMagnifyEndEvent<T>>(
    spatialEvents.onSpatialMagnifyEnd,
    currentTargetGetter,
  )

  const onSpatialDragStart = createEventHandler<T, SpatialDragStartEvent<T>>(
    spatialEvents.onSpatialDragStart,
    currentTargetGetter,
    (ev: SpatialDragStartEvent<T>) => ev.detail?.startLocation3D?.x,
    (ev: SpatialDragStartEvent<T>) => ev.detail?.startLocation3D?.y,
    (ev: SpatialDragStartEvent<T>) => ev.detail?.startLocation3D?.z,
    (ev: SpatialDragStartEvent<T>) => ev.detail?.globalLocation3D?.x,
    (ev: SpatialDragStartEvent<T>) => ev.detail?.globalLocation3D?.y,
    (ev: SpatialDragStartEvent<T>) => ev.detail?.globalLocation3D?.z,
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
