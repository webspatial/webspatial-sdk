'use client'

import type { ReactNode } from 'react'
import type { WebSpatialBootError } from './errors'
import {
  useBootSpatial,
  type UseBootSpatialOptions,
  type UseBootSpatialResult,
} from './useBootSpatial'

type SpatialBootBaseProps = {
  children: ReactNode
  onReady?: UseBootSpatialOptions['onReady']
  onError?: UseBootSpatialOptions['onError']
}

export type SpatialBootProps =
  | (SpatialBootBaseProps & {
      /**
       * Phase-2 / advanced: mount `children` immediately and let facades
       * show fallback until boot completes. Public docs (phase 1) do not
       * document this prop — default is `true`.
       */
      gate?: false
      fallback?: ReactNode
    })
  | (SpatialBootBaseProps & {
      /**
       * When `true` (default), `children` mount only after `bootSpatial()`
       * succeeds. On failure, `onError` runs and `children` stay unmounted.
       */
      gate?: true
      /** Shown while boot is in flight; defaults to blank when omitted. */
      fallback?: ReactNode
    })

function warnFallbackWithoutGate(): void {
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV !== 'production'
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '[WebSpatial] <SpatialBoot fallback={...}> is ignored unless `gate` is true. ' +
        'Remove `fallback` or set `gate={true}`.',
    )
  }
}

/**
 * Runs `bootSpatial()` after mount. Default (`gate={true}`): does not mount
 * `children` until boot succeeds; on `WebSpatialBootError`, invokes `onError`
 * and keeps `children` unmounted. Phase-2 integrators may pass `gate={false}` to
 * mount immediately with facade fallback → real upgrade.
 */
export function createSpatialBoot(
  useBootHook: (options: UseBootSpatialOptions) => UseBootSpatialResult,
): (props: SpatialBootProps) => ReactNode {
  function SpatialBootComponent({
    children,
    gate = true,
    fallback,
    onReady,
    onError,
  }: SpatialBootProps): ReactNode {
    if (!gate && fallback !== undefined) {
      warnFallbackWithoutGate()
    }

    const { status } = useBootHook({ onReady, onError })

    const showChildren = gate ? status === 'ready' : true

    if (!showChildren) {
      return fallback ?? null
    }

    return children
  }

  SpatialBootComponent.displayName = 'SpatialBoot'
  return SpatialBootComponent
}

export const SpatialBoot = createSpatialBoot(useBootSpatial)
