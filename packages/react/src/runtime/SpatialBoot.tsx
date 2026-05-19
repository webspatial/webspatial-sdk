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
  | (SpatialBootBaseProps & { gate?: false; fallback?: ReactNode })
  | (SpatialBootBaseProps & { gate: true; fallback?: ReactNode })

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
 * Runs `bootSpatial()` after mount. By default (`gate={false}`) children render
 * immediately; facades handle fallback → real. With `gate={true}`, children
 * mount only after boot succeeds or fails (degraded path still mounts children).
 */
export function createSpatialBoot(
  useBootHook: (options: UseBootSpatialOptions) => UseBootSpatialResult,
): (props: SpatialBootProps) => ReactNode {
  function SpatialBootComponent({
    children,
    gate = false,
    fallback,
    onReady,
    onError,
  }: SpatialBootProps): ReactNode {
    if (!gate && fallback !== undefined) {
      warnFallbackWithoutGate()
    }

    const { status } = useBootHook({ onReady, onError })

    const showChildren =
      !gate || status === 'ready' || status === 'failed'

    if (!showChildren) {
      return fallback ?? null
    }

    return children
  }

  SpatialBootComponent.displayName = 'SpatialBoot'
  return SpatialBootComponent
}

export const SpatialBoot = createSpatialBoot(useBootSpatial)
