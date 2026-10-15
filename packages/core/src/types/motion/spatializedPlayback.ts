/** Async playback failure from native bridge. */
export interface SpatializedPlaybackError {
  /** Operation that failed. */
  command:
    | 'create'
    | 'play'
    | 'pause'
    | 'resume'
    | 'stop'
    | 'reset'
    | 'finish'
    | 'destroy'
  /** Native or SDK error code when available. */
  code?: string
  /** Human-readable failure reason. */
  reason: string
}
