import { useEffect, useReducer, useRef } from 'react'
import {
  supports,
  type SpatializedMotionConfig,
  type SpatializedMotionHandle,
} from '@webspatial/core-sdk'
import { validateSpatializedMotionConfig } from './validate'
import { SpatializedMotionController } from '../../../../core/src/spatialized/motion/SpatializedMotionController'

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
      supportsMotionKind: kind => supports('useSpatializedMotion', [kind]),
    })
  }
  const controller = controllerRef.current

  useEffect(() => {
    controller.updateDefinition(config)
  }, [config, controller])

  useEffect(() => {
    const active = controller
    return () => {
      active.destroy()
    }
  }, [controller])

  return controller
}
