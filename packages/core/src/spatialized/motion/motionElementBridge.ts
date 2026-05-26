import type { Spatialized2DElement } from '../../Spatialized2DElement'
import type { SpatializedStatic3DElement } from '../../SpatializedStatic3DElement'
import type { SpatializedDynamic3DElement } from '../../SpatializedDynamic3DElement'
import { SpatialWebEvent } from '../../SpatialWebEvent'
import type { AnimateSpatialDivCommand } from '../../types/spatialDivAnimation'
import type { SpatialDivVisualValues } from '../../types/spatialDivVisual'
import type {
  AnimateSpatializedStatic3DCommand,
  AnimateSpatializedStatic3DResult,
} from '../../types/spatializedStatic3dAnimation'
import type {
  AnimateSpatializedDynamic3DCommand,
  AnimateSpatializedDynamic3DResult,
} from '../../types/spatializedDynamic3dAnimation'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'

export type MotionHostElement =
  | Spatialized2DElement
  | SpatializedStatic3DElement
  | SpatializedDynamic3DElement

type MotionPlayCommand =
  | (AnimateSpatialDivCommand & { type: 'play' })
  | (AnimateSpatializedStatic3DCommand & { type: 'play' })
  | (AnimateSpatializedDynamic3DCommand & { type: 'play' })

type MotionSessionCommand =
  | AnimateSpatialDivCommand
  | AnimateSpatializedStatic3DCommand
  | AnimateSpatializedDynamic3DCommand

export type MotionAnimatePlayResult =
  | import('../../types/spatialDivAnimation').AnimateSpatialDivResult
  | AnimateSpatializedStatic3DResult
  | AnimateSpatializedDynamic3DResult

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
        command as AnimateSpatializedStatic3DCommand & { type: 'play' },
      )
    case 'dynamic3d':
      return (element as SpatializedDynamic3DElement).animateMotion(
        command as AnimateSpatializedDynamic3DCommand & { type: 'play' },
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
      return (element as SpatializedStatic3DElement).animateMotion(command)
    case 'dynamic3d':
      return (element as SpatializedDynamic3DElement).animateMotion(command)
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
