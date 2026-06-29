'use client'

import { ComponentType, ElementType, ForwardedRef, forwardRef } from 'react'
import type {
  Spatialized2DElementContainerProps,
  SpatializedElementRef,
} from '../spatialized-container/types'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

const SPATIAL_EVENT_PROPS = [
  'onSpatialTap',
  'onSpatialDragStart',
  'onSpatialDrag',
  'onSpatialDragEnd',
  'onSpatialRotate',
  'onSpatialRotateEnd',
  'onSpatialMagnify',
  'onSpatialMagnifyEnd',
  'spatialEventOptions',
  'onSpatialContentReady',
  'xr-animation',
] as const

const facadeCache = new Map<ElementType, ComponentType<any>>()

/**
 * Default-entry facade for the `withSpatialized2DElementContainer(Comp)` HOC.
 *
 * Per spec "HOC facade preserves wrapper-cache identity contract" Scenario:
 * passing the same `Component` reference more than once returns the same
 * wrapper facade reference. Cache key is the raw `Component` reference; no
 * normalization.
 *
 * In fallback mode the wrapper is a transparent passthrough — `<Component
 * {...passthroughProps} ref={ref} />` after stripping spatial-only event
 * handlers / spatial-only options. Once `bootSpatial()` resolves, the
 * wrapper renders the real spatialized container by delegating to the real
 * HOC produced via `requireSpatialImpl().withSpatialized2DElementContainer`
 * (the real HOC has its own internal cache, so `RealHOC(Component)`
 * returns a stable reference across renders).
 *
 * **PARITY (spec tasks.md §15.6)**: Path 2 unpinned in
 * `runtime-capabilities` today; tracked under §15.8 (see
 * `src/__tests__/parity.test.tsx` "withSpatialized2DElementContainer …
 * parity" `it.todo`). Keep this transparent-passthrough fallback in sync
 * with whatever the real-impl unsupported branch later commits to.
 */
export function withSpatialized2DElementContainer<P extends ElementType>(
  Component: P,
): P {
  const cached = facadeCache.get(Component)
  if (cached) {
    return cached as unknown as P
  }

  const FacadeWrapper = forwardRef(function FacadeWrapper(
    givenProps: Spatialized2DElementContainerProps<P>,
    ref: ForwardedRef<SpatializedElementRef>,
  ) {
    const ready = useSpatialReady()

    if (!ready) {
      warnBootForgotten('withSpatialized2DElementContainer')
      const { component: _component, ...rest } = givenProps as Record<
        string,
        unknown
      > & { component?: unknown }
      // Plain-web / pre-boot fallback is a transparent passthrough. Per the
      // product-confirmed semantics, `onSpatialContentReady` fires ONLY when a
      // real WebSpatial spatial content host exists (the portal path in
      // `useSpatialContentReady`); it MUST NOT fire on any degraded/plain-web
      // host. `stripSpatialOnlyProps` removes it (and the other spatial-only
      // props) so it is neither invoked here nor leaked as a DOM attribute.
      const passthrough = stripSpatialOnlyProps(rest)
      const Element = Component as ElementType
      return <Element {...(passthrough as any)} ref={ref as any} />
    }
    const RealHOC = requireSpatialImpl()
      .withSpatialized2DElementContainer as typeof withSpatialized2DElementContainer
    const RealWrapper = RealHOC(Component)
    const RealComponent = RealWrapper as unknown as ComponentType<
      Spatialized2DElementContainerProps<P> & { ref?: unknown }
    >
    return <RealComponent {...givenProps} ref={ref as any} />
  })

  FacadeWrapper.displayName = `WithSpatialized2DElementContainer(${componentDisplayName(Component)})`

  facadeCache.set(Component, FacadeWrapper)
  return FacadeWrapper as unknown as P
}

export function __resetWithSpatialized2DElementContainerCacheForTests(): void {
  facadeCache.clear()
}

function stripSpatialOnlyProps(props: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if ((SPATIAL_EVENT_PROPS as readonly string[]).includes(key)) continue
    out[key] = props[key]
  }
  return out
}

function componentDisplayName(Component: ElementType): string {
  if (typeof Component === 'string') return Component
  const c = Component as { displayName?: string; name?: string }
  return c.displayName || c.name || 'Component'
}
