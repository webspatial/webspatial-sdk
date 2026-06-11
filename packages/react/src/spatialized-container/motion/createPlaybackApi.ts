import type {
  SpatializedPlaybackApi,
  SpatializedMotionHandle,
} from '@webspatial/core-sdk'

export function createPlaybackApi(
  controller: SpatializedMotionHandle,
): SpatializedPlaybackApi {
  return {
    play: () => controller.play(),
    pause: () => controller.pause(),
    resume: () => controller.resume(),
    stop: () => controller.stop(),
    reset: () => controller.reset(),
    finish: () => controller.finish(),
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
