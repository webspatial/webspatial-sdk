'use client'

import { createSpatialBoot } from './createSpatialBoot'
import { useBootSpatial } from './useBootSpatial'
export type { SpatialBootProps } from './createSpatialBoot'

export const SpatialBoot = /* @__PURE__ */ createSpatialBoot(useBootSpatial)
