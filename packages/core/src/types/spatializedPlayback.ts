/** Async playback failure from native bridge. */
export interface SpatializedPlaybackError {
  animationId: string
  command: 'play' | 'pause' | 'resume' | 'stop' | 'reset' | 'finish'
  code?: string
  reason: string
}
