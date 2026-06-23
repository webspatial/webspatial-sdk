import { createElement, ForwardedRef } from 'react'
import type {
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DElementRef,
} from './spatialized-container'

export const MODEL_FALLBACK_TAG = 'webspatial-model-fallback'

export type ModelFallbackProps = SpatializedStatic3DContainerProps & {
  'enable-xr'?: boolean
}

export type ModelFallbackRef = SpatializedStatic3DElementRef

/**
 * Shared degraded Model renderer.
 *
 * React warns for lowercase unknown tags such as `<model>` in current
 * Chromium/WebView builds. Use a custom-element-shaped host so every degraded
 * path stays warning-free while preserving layout-related props, asset props,
 * children, and ref attachment.
 */
export function renderModelFallbackElement(
  props: ModelFallbackProps,
  ref: ForwardedRef<ModelFallbackRef>,
): JSX.Element {
  const {
    onSpatialTap: _onSpatialTap,
    onSpatialDragStart: _onSpatialDragStart,
    onSpatialDrag: _onSpatialDrag,
    onSpatialDragEnd: _onSpatialDragEnd,
    onSpatialRotate: _onSpatialRotate,
    onSpatialRotateEnd: _onSpatialRotateEnd,
    onSpatialMagnify: _onSpatialMagnify,
    onSpatialMagnifyEnd: _onSpatialMagnifyEnd,
    spatialEventOptions: _spatialEventOptions,
    'enable-xr': _enableXR,
    ...modelProps
  } = props

  return createElement(MODEL_FALLBACK_TAG, {
    ...modelProps,
    ref: ref as ForwardedRef<HTMLElement>,
  })
}
