import type {
  SpatializedPlaybackApi,
  SpatializedMotionHandle,
} from '@webspatial/core-sdk'

export function createPlaybackApi(
  controller: SpatializedMotionHandle,
): SpatializedPlaybackApi {
  return {
    play: () => controller.play(),
    pause: keys => controller.pause(keys),
    resume: keys => controller.resume(keys),
    cancel: keys => controller.cancel(keys),
    get isAnimating() {
      return controller.isAnimating
    },
    get isPaused() {
      return controller.isPaused
    },
    get finished() {
      return controller.finished
    },
    get playState() {
      return controller.playState
    },
  }
}
