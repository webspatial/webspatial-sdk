'use client'

import { ComponentType, ElementType, Ref, forwardRef } from 'react'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { getBootForgottenDiagnostic } from './shared/warnBootForgotten'

const facadeCache = new Map<ElementType, ComponentType<any>>()

/**
 * Default-entry facade for the `withSpatialMonitor(El)` HOC.
 *
 * Per spec "HOC facade preserves wrapper-cache identity contract" Scenario:
 * same `El` reference → same wrapper reference. Cache key is the raw `El`.
 *
 * Fallback renders `<El {...passthrough} ref={ref} />` (transparent
 * passthrough). After boot the wrapper delegates to the real
 * `withSpatialMonitor(El)` HOC, which has its own internal cache so
 * repeated calls return a stable reference.
 *
 * **PARITY (spec tasks.md §15.6)**: Path 2 unpinned in
 * `runtime-capabilities` today; tracked under §15.8 (see
 * `src/__tests__/parity.test.tsx` "withSpatialMonitor … parity"
 * `it.todo`). Keep this transparent-passthrough fallback in sync with
 * whatever the real-impl unsupported branch later commits to.
 */
export function withSpatialMonitor(El: ElementType): ElementType {
  const cached = facadeCache.get(El)
  if (cached) return cached

  const FacadeWrapper = forwardRef(function FacadeWrapper(
    givenProps: Record<string, unknown>,
    ref: Ref<HTMLElement>,
  ) {
    const ready = useSpatialReady()
    if (!ready) {
      const { El: _ignoredEl, ...passthrough } = givenProps
      const Element = El
      return (
        <>
          {getBootForgottenDiagnostic('withSpatialMonitor')}
          <Element {...(passthrough as any)} ref={ref as any} />
        </>
      )
    }
    const RealHOC = requireSpatialImpl()
      .withSpatialMonitor as typeof withSpatialMonitor
    const RealWrapper = RealHOC(El) as unknown as ComponentType<
      Record<string, unknown> & { ref?: unknown }
    >
    return <RealWrapper {...givenProps} ref={ref as any} />
  })

  FacadeWrapper.displayName = `WithSpatialMonitor(${componentDisplayName(El)})`

  facadeCache.set(El, FacadeWrapper)
  return FacadeWrapper
}

export function __resetWithSpatialMonitorCacheForTests(): void {
  facadeCache.clear()
}

function componentDisplayName(El: ElementType): string {
  if (typeof El === 'string') return El
  const c = El as { displayName?: string; name?: string }
  return c.displayName || c.name || 'Component'
}
