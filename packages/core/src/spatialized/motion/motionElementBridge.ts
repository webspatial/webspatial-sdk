import type { Spatialized2DElement } from '../../Spatialized2DElement'
import type { SpatializedStatic3DElement } from '../../SpatializedStatic3DElement'
import type { SpatializedDynamic3DElement } from '../../SpatializedDynamic3DElement'
import { SpatialWebEvent } from '../../SpatialWebEvent'
import type { AnimateSpatialDivCommand } from '../../types/spatialDivAnimation'
import type { SpatialDivVisualValues } from '../../types/spatialDivVisual'
import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
  ContainerElementMotionCommand,
} from '../../types/spatializedElementMotion'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'

export type MotionHostElement =
  | Spatialized2DElement
  | SpatializedStatic3DElement
  | SpatializedDynamic3DElement

type MotionPlayCommand =
  | (AnimateSpatialDivCommand & { type: 'play' })
  | (AnimateSpatializedElementMotionCommand & { type: 'play' })

type MotionSessionCommand =
  | AnimateSpatialDivCommand
  | AnimateSpatializedElementMotionCommand

export type MotionAnimatePlayResult =
  | import('../../types/spatialDivAnimation').AnimateSpatialDivResult
  | AnimateSpatializedElementMotionResult

function containerMotionCommand(
  kind: 'static3d' | 'dynamic3d',
  command: ContainerElementMotionCommand,
): AnimateSpatializedElementMotionCommand {
  return { ...command, targetKind: kind }
}

export async function motionElementPlay(
  kind: SpatializedMotionKind,
  element: MotionHostElement,
  command: MotionPlayCommand,
): Promise<MotionAnimatePlayResult> {
  switch (kind) {
    case 'spatialized2d':
      return (element as Spatialized2DElement).animateSpatialDiv(
        command as AnimateSpatialDivCommand & { type: 'play' },
      )
    case 'static3d':
      return (element as SpatializedStatic3DElement).animateMotion(
        containerMotionCommand(
          'static3d',
          command,
        ) as AnimateSpatializedElementMotionCommand & {
          type: 'play'
        },
      )
    case 'dynamic3d':
      return (element as SpatializedDynamic3DElement).animateMotion(
        containerMotionCommand(
          'dynamic3d',
          command,
        ) as AnimateSpatializedElementMotionCommand & {
          type: 'play'
        },
      )
  }
}

export async function motionElementSessionCommand(
  kind: SpatializedMotionKind,
  element: MotionHostElement,
  command: MotionSessionCommand,
): Promise<SpatialDivVisualValues | void> {
  switch (kind) {
    case 'spatialized2d':
      return (element as Spatialized2DElement).animateSpatialDiv(command)
    case 'static3d':
      return (element as SpatializedStatic3DElement).animateMotion(
        containerMotionCommand('static3d', command),
      )
    case 'dynamic3d':
      return (element as SpatializedDynamic3DElement).animateMotion(
        containerMotionCommand('dynamic3d', command),
      )
  }
}

export function motionElementCleanupListeners(
  kind: SpatializedMotionKind,
  element: MotionHostElement,
  animationId: string,
): void {
  switch (kind) {
    case 'spatialized2d':
      ;(element as Spatialized2DElement).cleanupSpatialDivAnimationListeners(
        animationId,
      )
      break
    case 'static3d':
    case 'dynamic3d':
      SpatialWebEvent.removeEventReceiver(`${animationId}_completed`)
      SpatialWebEvent.removeEventReceiver(`${animationId}_canceled`)
      SpatialWebEvent.removeEventReceiver(`${animationId}_failed`)
      break
  }
}
