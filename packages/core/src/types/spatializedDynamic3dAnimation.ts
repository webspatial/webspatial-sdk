export interface Dynamic3DMotionBinding {
  readonly __motionObjectId: string
  readonly __kind: 'dynamic3dMotion'
  readonly __animating: boolean
  readonly __suppressedFields: Set<string> | null
}

export interface Dynamic3DMotionBindingInternal extends Dynamic3DMotionBinding {
  __getSuppressedFields: () => Set<string> | null
  __setElement?: (
    element: import('../SpatializedDynamic3DElement').SpatializedDynamic3DElement,
  ) => void
  __onUnbind?: () => void
}
