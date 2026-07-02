import {
  validateNormalizedMotionConfig,
  validateSpatializedMotionConfig,
} from './validate'
import type { SpatializedMotionConfig } from '../../types/motion/spatializedMotion'

const normalizedConfig: SpatializedMotionConfig = {
  duration: 1,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { at: 0, value: 0 },
        { at: 1, value: 1 },
      ],
    },
  ],
}

validateNormalizedMotionConfig(normalizedConfig)
validateSpatializedMotionConfig(normalizedConfig)

// @ts-expect-error validateNormalizedMotionConfig no longer accepts target options
validateNormalizedMotionConfig(normalizedConfig, { targetKind: 'static3d' })

// @ts-expect-error validateSpatializedMotionConfig no longer accepts target options
validateSpatializedMotionConfig(normalizedConfig, { targetKind: 'dynamic3d' })
