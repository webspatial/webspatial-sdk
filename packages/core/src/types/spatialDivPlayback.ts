/** Async playback failure from native bridge. */
export interface SpatialDivPlaybackError {
  animationId: string
  command: 'play' | 'pause' | 'resume' | 'cancel'
  code?: string
  reason: string
}
