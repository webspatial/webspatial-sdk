import { useEffect, useReducer, useRef } from 'react'
import {
  SpatializedMotionController,
  supports,
  validateSpatializedMotionConfig,
  type SpatializedMotionConfig,
  type SpatializedMotionHandle,
} from '@webspatial/core-sdk'

export function useMotionController(
  config: SpatializedMotionConfig,
  onValuesChange?: (
    values: import('@webspatial/core-sdk').SpatializedVisualValues,
  ) => void,
): SpatializedMotionHandle {
  validateSpatializedMotionConfig(config)

  const [, tick] = useReducer((n: number) => n + 1, 0)
  const controllerRef = useRef<SpatializedMotionHandle | null>(null)
  if (!controllerRef.current || controllerRef.current.isDestroyed) {
    controllerRef.current = new SpatializedMotionController(config, {
      onStateChange: () => tick(),
      onValuesChange,
      supportsMotionKind: kind =>
        supports('useAnimation', [kind === 'spatialized2d' ? 'element' : kind]),
    })
  }
  const controller = controllerRef.current

  useEffect(() => {
    controller.updateConfig(config)
  }, [config, controller])

  useEffect(() => {
    const active = controller
    return () => {
      active.destroy()
    }
  }, [controller])

  return controller
}
