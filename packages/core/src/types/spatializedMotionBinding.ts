// ---- Plan A: `animation` prop binding (opaque handle; legacy Portal path) ----

export interface SpatializedMotionBinding {
  readonly __animationObjectId: string
  readonly __kind: 'spatializedMotion'
  readonly __animating: boolean
  /** @internal Fields being suppressed during animation. */
  readonly __suppressedFields: Set<string> | null
}

export interface SpatializedMotionBindingInternal
  extends SpatializedMotionBinding {
  __getSuppressedFields: () => Set<string> | null
  __onBind?: (elementId: string) => void
  __onUnbind?: () => void
}
