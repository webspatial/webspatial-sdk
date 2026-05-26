import { useEffect, useReducer, useRef } from 'react'
import {
  SpatializedMotionController,
  supports,
  validateSpatialDivMotionConfig,
  type SpatialDivMotionConfig,
  type SpatializedMotionHandle,
  type SpatializedMotionKind,
} from '@webspatial/core-sdk'

function capabilityTokenFor(
  kind: SpatializedMotionKind,
): 'element' | 'static3d' | 'dynamic3d' {
  switch (kind) {
    case 'spatialized2d':
      return 'element'
    case 'static3d':
      return 'static3d'
    case 'dynamic3d':
      return 'dynamic3d'
  }
}

export function useMotionController(
  kind: SpatializedMotionKind,
  config: SpatialDivMotionConfig,
  onValuesChange?: (
    values: import('@webspatial/core-sdk').SpatialDivVisualValues,
  ) => void,
): { controller: SpatializedMotionHandle; nativeCapable: boolean } {
  validateSpatialDivMotionConfig(config)

  const [, tick] = useReducer((n: number) => n + 1, 0)
  const token = capabilityTokenFor(kind)

  const controllerRef = useRef<SpatializedMotionHandle | null>(null)
  if (!controllerRef.current || controllerRef.current.isDestroyed) {
    controllerRef.current = new SpatializedMotionController(config, kind, {
      forceNativePlayback: supports('useAnimation', [token]),
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

  const nativeCapable = supports('useAnimation', [token])

  return { controller, nativeCapable }
}
