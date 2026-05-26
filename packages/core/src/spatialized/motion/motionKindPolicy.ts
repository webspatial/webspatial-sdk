import type { SpatialDivMotionConfig } from '../../types/spatialDivMotion'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'
import { getMotionSuppressedFields } from '../../spatialdiv/motion/getMotionSuppressedFields'
import { getStatic3DMotionSuppressedFields } from '../../static3d/motion/getStatic3DMotionSuppressedFields'

export interface MotionKindPolicy {
  readonly kind: SpatializedMotionKind
  readonly capabilityToken: 'element' | 'static3d' | 'dynamic3d'
  readonly webPlayback: 'raf' | 'none'
  readonly motionObjectIdPrefix: string
  readonly sessionIdPrefix: string
  readonly controllerLabel: string
  getSuppressedFields(config: SpatialDivMotionConfig): Set<string> | null
}

export const MOTION_KIND_POLICIES: Record<
  SpatializedMotionKind,
  MotionKindPolicy
> = {
  spatialized2d: {
    kind: 'spatialized2d',
    capabilityToken: 'element',
    webPlayback: 'raf',
    motionObjectIdPrefix: '__sdmotion_',
    sessionIdPrefix: 'sdmotion_',
    controllerLabel: 'SpatializedMotionController',
    getSuppressedFields: config => getMotionSuppressedFields(config),
  },
  static3d: {
    kind: 'static3d',
    capabilityToken: 'static3d',
    webPlayback: 'none',
    motionObjectIdPrefix: '__s3motion_',
    sessionIdPrefix: 's3motion_',
    controllerLabel: 'SpatializedMotionController',
    getSuppressedFields: config => getStatic3DMotionSuppressedFields(config),
  },
  dynamic3d: {
    kind: 'dynamic3d',
    capabilityToken: 'dynamic3d',
    webPlayback: 'none',
    motionObjectIdPrefix: '__d3motion_',
    sessionIdPrefix: 'd3motion_',
    controllerLabel: 'SpatializedMotionController',
    getSuppressedFields: config => getMotionSuppressedFields(config),
  },
}
