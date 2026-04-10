import { supports } from '@webspatial/core-sdk'

/**
 * Runtime capability checks (`supports('Model')`, `supports('WindowScene', ['defaultSize'])`, …).
 * Spec: `openspec/changes/runtime-feature-detection/review.md`.
 */
export const WebSpatialRuntime = {
  supports,
} as const
