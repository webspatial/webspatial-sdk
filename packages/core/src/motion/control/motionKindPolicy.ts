import type { SpatializedMotionConfig } from '../../types/spatializedMotion'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'
import { getMotionSuppressedFields } from '../compute/suppressedFields'
import { getStatic3DMotionSuppressedFields } from '../kinds/static3d'

export interface MotionKindPolicy {
  readonly kind: SpatializedMotionKind
  readonly webPlayback: 'raf' | 'none'
  readonly motionObjectIdPrefix: string
  readonly sessionIdPrefix: string
  getSuppressedFields(config: SpatializedMotionConfig): Set<string> | null
}

export const MOTION_KIND_POLICIES: Record<
  SpatializedMotionKind,
  MotionKindPolicy
> = {
  spatialized2d: {
    kind: 'spatialized2d',
    webPlayback: 'raf',
    motionObjectIdPrefix: '__sdmotion_',
    sessionIdPrefix: 'sdmotion_',
    getSuppressedFields: config => getMotionSuppressedFields(config),
  },
  static3d: {
    kind: 'static3d',
    webPlayback: 'none',
    motionObjectIdPrefix: '__s3motion_',
    sessionIdPrefix: 's3motion_',
    getSuppressedFields: config => getStatic3DMotionSuppressedFields(config),
  },
  dynamic3d: {
    kind: 'dynamic3d',
    webPlayback: 'none',
    motionObjectIdPrefix: '__d3motion_',
    sessionIdPrefix: 'd3motion_',
    getSuppressedFields: config => getMotionSuppressedFields(config),
  },
}
