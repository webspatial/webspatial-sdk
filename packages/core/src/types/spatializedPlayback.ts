/** Async playback failure from native bridge. */
export interface SpatializedPlaybackError {
  animationId: string
  command: 'play' | 'pause' | 'resume' | 'cancel'
  code?: string
  reason: string
}
