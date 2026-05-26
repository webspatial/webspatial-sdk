import { useEffect, useReducer, useRef } from 'react'
import {
  SpatializedMotionController,
  supports,
  validateSpatialDivMotionConfig,
  type SpatialDivMotionConfig,
  type SpatializedMotionHandle,
  type SpatializedMotionKind,
} from '@webspatial/core-sdk'

export function useMotionController(
  kind: SpatializedMotionKind,
  config: SpatialDivMotionConfig,
  onValuesChange?: (
    values: import('@webspatial/core-sdk').SpatialDivVisualValues,
  ) => void,
): { controller: SpatializedMotionHandle; nativeCapable: boolean } {
  validateSpatialDivMotionConfig(config)

  const [, tick] = useReducer((n: number) => n + 1, 0)
  const nativeCapable = supports('useSpatializedMotion', [kind])

  const controllerRef = useRef<SpatializedMotionHandle | null>(null)
  if (!controllerRef.current || controllerRef.current.isDestroyed) {
    controllerRef.current = new SpatializedMotionController(config, kind, {
      forceNativePlayback: nativeCapable,
      onStateChange: () => tick(),
      onValuesChange,
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

  return { controller, nativeCapable }
}
