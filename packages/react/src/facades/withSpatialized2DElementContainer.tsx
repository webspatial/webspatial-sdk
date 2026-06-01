'use client'

import {
  ComponentType,
  ElementType,
  ForwardedRef,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type {
  SpatialContentReadyCallback,
  Spatialized2DElementContainerProps,
  SpatializedElementRef,
} from '../spatialized-container/types'
import { getSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

const isDev = process.env.NODE_ENV !== 'production'

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
 * HOC produced via `getSpatialImpl()!.withSpatialized2DElementContainer`
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
      > & { component?: unknown; onSpatialContentReady?: unknown }
      // `onSpatialContentReady` MUST still fire on the plain-web fallback host
      // (spec "Non-WebSpatial fallback still invokes ready"), but MUST NOT leak
      // as a DOM attribute. We read it out, strip ALL spatial-only props from
      // the DOM passthrough, and hand the callback to the fallback host that
      // invokes it in layout-effect timing once the host is connected.
      const onSpatialContentReady = rest.onSpatialContentReady as
        | SpatialContentReadyCallback
        | undefined
      const passthrough = stripSpatialOnlyProps(rest)
      return (
        <FallbackContentHost
          Element={Component as ElementType}
          forwardedRef={ref}
          onSpatialContentReady={onSpatialContentReady}
          {...(passthrough as Record<string, unknown>)}
        />
      )
    }
    const RealHOC = getSpatialImpl()!
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

/**
 * Plain-web fallback host for the default-entry `enable-xr` path.
 *
 * Mirrors the real `SpatializedContainer` degraded path's
 * `onSpatialContentReady` contract so a non-WebSpatial consumer of
 * `<div enable-xr onSpatialContentReady={cb} />` (which reaches this facade via
 * the JSX runtime before / without `bootSpatial()`) still gets `cb` invoked:
 *
 * - merges the forwarded spatial ref with an internal host ref so callers keep
 *   their `ref` AND we can observe the connected DOM host;
 * - never forwards `onSpatialContentReady` to the DOM element (it is consumed
 *   here, not spread into `rest`);
 * - invokes the callback in `useLayoutEffect` timing once `host.isConnected`;
 * - runs the returned cleanup on unmount / host change (falling edge).
 *
 * It does NOT handle the attachment-degraded suppression case: in the lazy
 * default entry an `AttachmentAsset` is a spatial primitive that only mounts
 * its real implementation after boot, so a `<div enable-xr>` inside an
 * attachment never reaches this pre-boot fallback. The real container handles
 * attachment suppression post-boot.
 */
function FallbackContentHost({
  Element,
  forwardedRef,
  onSpatialContentReady,
  children,
  ...rest
}: {
  Element: ElementType
  forwardedRef: ForwardedRef<SpatializedElementRef>
  onSpatialContentReady?: SpatialContentReadyCallback
  children?: unknown
  [key: string]: unknown
}) {
  const [hostEl, setHostEl] = useState<HTMLElement | null>(null)
  const callbackRef = useRef(onSpatialContentReady)
  callbackRef.current = onSpatialContentReady

  useLayoutEffect(() => {
    const cb = callbackRef.current
    if (!hostEl || !hostEl.isConnected || !cb) {
      return () => {}
    }

    let cleanup: void | (() => void)
    try {
      cleanup = cb({ host: hostEl })
    } catch (e) {
      if (isDev) {
        console.error('[WebSpatial] onSpatialContentReady threw', e)
      }
    }

    return () => {
      if (typeof cleanup !== 'function') return
      try {
        cleanup()
      } catch (e) {
        if (isDev) {
          console.error('[WebSpatial] onSpatialContentReady cleanup threw', e)
        }
      }
    }
    // Re-run only when the connected host node changes; a stable host across
    // re-renders (with a possibly-new callback identity, tracked via the ref)
    // MUST NOT re-invoke the callback (spec "Stable ready does not re-emit").
  }, [hostEl])

  const setHostRef = useCallback(
    (node: SpatializedElementRef | null) => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef != null) {
        forwardedRef.current = node
      }
      setHostEl(node as HTMLElement | null)
    },
    [forwardedRef],
  )

  const ElementType_ = Element
  return (
    <ElementType_ ref={setHostRef} {...rest}>
      {children as any}
    </ElementType_>
  )
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
