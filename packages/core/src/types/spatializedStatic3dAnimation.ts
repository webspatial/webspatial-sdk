export interface Static3DMotionBinding {
  readonly __motionObjectId: string
  readonly __kind: 'static3dMotion'
  readonly __animating: boolean
  readonly __suppressedFields: Set<string> | null
}

export interface Static3DMotionBindingInternal extends Static3DMotionBinding {
  __getSuppressedFields: () => Set<string> | null
  __setElement?: (
    element: import('../SpatializedStatic3DElement').SpatializedStatic3DElement,
  ) => void
  __onUnbind?: () => void
}
