// =============================================================================
// `runtime/eagerStubs.ts` — compatibility stubs for the lazy-load runtime API
// surface, used by the eager entry (`@webspatial/react-sdk/eager`).
//
// The eager entry statically links the spatial implementation, so the
// bridge / boot / readiness API has no work to do — but consumer code
// written against the lazy-load default entry expects these names to
// exist. The stubs here let consumers migrate by changing only their
// import root.
//
// Per the "Eager-mode entry for spatial-only consumers" Requirement
// Scenarios:
//
//   - `bootSpatial()` returns `Promise.resolve()` immediately
//   - `isSpatialReady()` returns `true`
//   - `useSpatialReady()` returns `true` on first and every render
//   - `onSpatialLoadError(cb)` registers the callback but it is never
//     invoked (eager entry has no dynamic load and therefore no failure)
//
// Dev builds emit a one-shot console.warn when `bootSpatial()` is called,
// reminding the consumer that boot is unnecessary on the eager entry.
// The warning is gated on `process.env.NODE_ENV !== 'production'` so
// production builds tree-shake it out.
// =============================================================================

import { useEffect, useRef } from 'react'
import type { WebSpatialBootError } from './errors'
import type {
  BootStatus,
  UseBootSpatialOptions,
  UseBootSpatialResult,
} from './useBootSpatial'
import { createSpatialBoot } from './SpatialBoot'

let bootWarned = false

/**
 * Eager-mode `bootSpatial` stub.
 *
 * Returns a resolved promise without scheduling any dynamic import,
 * since the eager entry has already statically linked the spatial
 * implementation by the time any user code runs.
 */
export function bootSpatialEager(): Promise<void> {
  if (
    !bootWarned &&
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV !== 'production'
  ) {
    bootWarned = true
    // eslint-disable-next-line no-console
    console.warn(
      '[WebSpatial] bootSpatial() is a no-op on the eager entry ' +
        '(@webspatial/react-sdk/eager) — the spatial implementation is ' +
        'already statically linked. You can safely remove this call when ' +
        'using the eager entry.',
    )
  }
  return Promise.resolve()
}

/**
 * Eager-mode `isSpatialReady` stub. Always returns `true` because the
 * spatial implementation is statically linked at module-evaluation time.
 */
export function isSpatialReadyEager(): boolean {
  return true
}

/**
 * Eager-mode `useSpatialReady` stub. Always returns `true` on every
 * render. Implementation does NOT use `useSyncExternalStore` because the
 * value is constant — a plain function call returning a constant is
 * cheaper and avoids the per-component subscription bookkeeping that
 * the lazy-load implementation needs.
 */
export function useSpatialReadyEager(): boolean {
  return true
}

/**
 * Eager-mode `onSpatialLoadError` stub. Registers the callback for
 * shape compatibility but never invokes it — the eager entry has no
 * dynamic load and therefore no load failure path.
 */
export function onSpatialLoadErrorEager(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cb: (error: WebSpatialBootError) => void,
): () => void {
  return noop
}

function noop(): void {
  // intentionally empty
}

/**
 * Eager-mode `useBootSpatial` stub. Reports `ready` immediately; `boot()`
 * delegates to the no-op `bootSpatialEager`.
 */
export function useBootSpatialEager(
  options: UseBootSpatialOptions = {},
): UseBootSpatialResult {
  const { onReady } = options
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    void bootSpatialEager().then(() => {
      onReadyRef.current?.()
    })
  }, [])

  return {
    status: 'ready' satisfies BootStatus,
    error: null,
    boot: bootSpatialEager,
  }
}

/** Eager entry `SpatialBoot` — same gate semantics, instant ready status. */
export const SpatialBootEager = createSpatialBoot(useBootSpatialEager)

// Test-only: reset the one-shot warning latch so multiple test runs
// can each verify the warning fires on first call.
export function __resetEagerStubsForTests(): void {
  bootWarned = false
}
