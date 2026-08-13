import type { SpatializedMotionConfig } from '@webspatial/core-sdk'

// Ignore callback identity so visual state does not reset on every render.
export function getMotionConfigSignature(
  config: SpatializedMotionConfig,
): string {
  const effectiveConfig =
    config.timeline !== undefined
      ? { ...config, from: undefined, to: undefined }
      : config
  return JSON.stringify(effectiveConfig, (_key, value) =>
    typeof value === 'function' ? undefined : value,
  )
}
