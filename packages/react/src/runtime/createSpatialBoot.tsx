'use client'

import type { ReactNode } from 'react'
import type {
  UseBootSpatialOptions,
  UseBootSpatialResult,
} from './useBootSpatial'

export type SpatialBootProps = {
  children: ReactNode
  onReady?: UseBootSpatialOptions['onReady']
  onError?: UseBootSpatialOptions['onError']
}

/**
 * Runs `bootSpatial()` after mount. Does not mount `children` until boot
 * succeeds; on `WebSpatialBootError`, invokes `onError` and keeps `children`
 * unmounted.
 */
export function createSpatialBoot(
  useBootHook: (options: UseBootSpatialOptions) => UseBootSpatialResult,
): (props: SpatialBootProps) => ReactNode {
  function SpatialBootComponent({
    children,
    onReady,
    onError,
  }: SpatialBootProps): ReactNode {
    const { status } = useBootHook({ onReady, onError })

    if (status !== 'ready') {
      return null
    }

    return children
  }

  SpatialBootComponent.displayName = 'SpatialBoot'
  return SpatialBootComponent
}
