import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
} from '../../types/spatializedElementMotion'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'

/**
 * Narrow structural interface the motion controller needs from a host element.
 *
 * The controller only ever reads `.id` and calls `.animateMotion()`, so it
 * depends on this two-member interface instead of the three concrete element
 * classes (Dependency Inversion). The element classes implement it structurally,
 * which also removes the previous `as MotionHostBridge` casts.
 */
export interface MotionHost {
  readonly id: string
  animateMotion(
    command: AnimateSpatializedElementMotionCommand,
  ): Promise<
    AnimateSpatializedElementMotionResult | SpatializedVisualValues | void
  >
}
