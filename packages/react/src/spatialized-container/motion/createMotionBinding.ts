import type { SpatializedMotionConfig } from '@webspatial/core-sdk'
import type { AnimationBinding } from './AnimationBinding'
import { AnimationBinding as AnimationBindingImpl } from './AnimationBinding'

export function createMotionBinding(
  config: SpatializedMotionConfig,
  options?: ConstructorParameters<typeof AnimationBindingImpl>[1],
): AnimationBinding {
  return new AnimationBindingImpl(config, options)
}
