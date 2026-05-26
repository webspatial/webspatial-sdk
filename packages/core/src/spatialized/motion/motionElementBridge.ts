import type { Spatialized2DElement } from '../../Spatialized2DElement'
import type { SpatializedStatic3DElement } from '../../SpatializedStatic3DElement'
import type { SpatializedDynamic3DElement } from '../../SpatializedDynamic3DElement'
import { SpatialWebEvent } from '../../SpatialWebEvent'
import type { SpatialDivVisualValues } from '../../types/spatialDivVisual'
import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
  ElementMotionCommand,
} from '../../types/spatializedElementMotion'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'

export type MotionHostElement =
  | Spatialized2DElement
  | SpatializedStatic3DElement
  | SpatializedDynamic3DElement

type MotionPlayCommand = ElementMotionCommand & { type: 'play' }

type MotionSessionCommand = ElementMotionCommand

export type MotionAnimatePlayResult = AnimateSpatializedElementMotionResult

function elementMotionCommand(
  kind: SpatializedMotionKind,
  command: ElementMotionCommand,
): AnimateSpatializedElementMotionCommand {
  return { ...command, targetKind: kind }
}

type MotionElement = {
  animateMotion(
    command: AnimateSpatializedElementMotionCommand,
  ): Promise<
    AnimateSpatializedElementMotionResult | SpatialDivVisualValues | void
  >
}

export async function motionElementPlay(
  kind: SpatializedMotionKind,
  element: MotionHostElement,
  command: MotionPlayCommand,
): Promise<MotionAnimatePlayResult> {
  return (element as MotionElement).animateMotion(
    elementMotionCommand(
      kind,
      command,
    ) as AnimateSpatializedElementMotionCommand & {
      type: 'play'
    },
  ) as Promise<AnimateSpatializedElementMotionResult>
}

export async function motionElementSessionCommand(
  kind: SpatializedMotionKind,
  element: MotionHostElement,
  command: MotionSessionCommand,
): Promise<SpatialDivVisualValues | void> {
  return (await (element as MotionElement).animateMotion(
    elementMotionCommand(kind, command),
  )) as SpatialDivVisualValues | void
}

export function motionElementCleanupListeners(
  _kind: SpatializedMotionKind,
  _element: MotionHostElement,
  animationId: string,
): void {
  SpatialWebEvent.removeEventReceiver(`${animationId}_completed`)
  SpatialWebEvent.removeEventReceiver(`${animationId}_canceled`)
  SpatialWebEvent.removeEventReceiver(`${animationId}_failed`)
}
