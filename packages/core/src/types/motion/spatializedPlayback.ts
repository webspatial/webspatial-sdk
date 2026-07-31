/** Stable Entity or spatialized-element playback failure. */
export interface SpatializedPlaybackError {
  /** Machine-readable failure category. */
  code:
    | 'TARGET_NOT_FOUND'
    | 'UNSUPPORTED_TARGET'
    | 'ANIMATION_NOT_FOUND'
    | 'INVALID_TIMELINE'
    | 'COMPILATION_FAILED'
    | 'INVALID_CONTROL_STATE'
    | 'INVALID_SET_VALUES'
  /** Human-readable failure reason. */
  reason: string
}
