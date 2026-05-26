// ---- Plan A: `animation` prop binding (opaque handle) ----

export interface SpatialDivAnimationBinding {
  readonly __animationObjectId: string
  readonly __kind: 'spatialDiv'
  readonly __animating: boolean
  /** @internal Fields being suppressed during animation. */
  readonly __suppressedFields: Set<string> | null
}

export interface SpatialDivAnimationBindingInternal
  extends SpatialDivAnimationBinding {
  __getSuppressedFields: () => Set<string> | null
  __onBind?: (elementId: string) => void
  __onUnbind?: () => void
}

// ---- Cross-layer bridge (internal; used by Spatialized2DElement) ----

import type {
  AnimateSpatializedElementMotionResult,
  ElementMotionCommand,
} from './spatializedElementMotion'

/** @deprecated Prefer {@link ElementMotionCommand} + `AnimateSpatializedElementMotion`. */
export type AnimateSpatialDivCommand = ElementMotionCommand

/** @deprecated Prefer {@link AnimateSpatializedElementMotionResult}. */
export type AnimateSpatialDivResult = AnimateSpatializedElementMotionResult
