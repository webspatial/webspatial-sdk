import { ForwardedRef, useCallback } from 'react'
import { SpatializedContainerProps, SpatializedElementRef } from './types'
import { SpatialWindowContext } from './context/SpatialWindowContext'

type MeasureModeProps<T extends SpatializedElementRef> =
  SpatializedContainerProps<T> & {
    innerRef: ForwardedRef<SpatializedElementRef<T>>
  }

/**
 * Measurement-only rendering for SpatialOverlay's hidden tree. It preserves
 * DOM layout, but disables all WebSpatial/native side effects.
 */
export function MeasureModeContainer<T extends SpatializedElementRef>({
  innerRef,
  ...inprops
}: MeasureModeProps<T>) {
  type PlainProps = SpatializedContainerProps<T> & {
    'enable-xr'?: unknown
    sizingMode?: unknown
    overlayPortalMode?: unknown
  }
  const {
    component: Component,
    children,
    ['enable-xr']: _enableXR,
    onSpatialTap: _onSpatialTap,
    onSpatialDragStart: _onSpatialDragStart,
    onSpatialDrag: _onSpatialDrag,
    onSpatialDragEnd: _onSpatialDragEnd,
    onSpatialRotate: _onSpatialRotate,
    onSpatialRotateEnd: _onSpatialRotateEnd,
    onSpatialMagnify: _onSpatialMagnify,
    onSpatialMagnifyEnd: _onSpatialMagnifyEnd,
    spatialEventOptions: _spatialEventOptions,
    spatializedContent: _content,
    createSpatializedElement: _create,
    getExtraSpatializedElementProperties: _getExtra,
    extraRefProps: _extraRef,
    sizingMode: _sizingMode,
    onSpatialContentReady: _onSpatialContentReady,
    overlayPortalMode: _overlayPortalMode,
    ...restProps
  } = inprops as PlainProps

  const setHostRef = useCallback(
    (node: SpatializedElementRef<T> | null) => {
      if (typeof innerRef === 'function') {
        innerRef(node)
      } else if (innerRef != null) {
        innerRef.current = node
      }
    },
    [innerRef],
  )

  return (
    <SpatialWindowContext.Provider value={null}>
      <Component ref={setHostRef} {...restProps}>
        {children}
      </Component>
    </SpatialWindowContext.Provider>
  )
}
