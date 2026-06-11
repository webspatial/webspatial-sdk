import { AnimateSpatializedElementMotionJSBCommand } from '../../JSBCommand'
import {
  addMotionEventReceivers,
  removeMotionEventReceivers,
} from './motionEventReceivers'
import { parseSpatializedVisualValues } from './parseSpatializedVisualValues'
import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
  ElementMotionCommand,
} from '../../types/spatializedElementMotion'
import type { SpatializedPlaybackError } from '../../types/spatializedPlayback'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type { SpatializedMotionKind } from '../../types/spatializedMotion'

/**
 * Bridges motion commands to JSB and normalizes native completion payloads.
 *
 * @param elementId Default element id when the command does not provide one.
 * @param targetKind Motion kind that selects the native backend behavior.
 * @param command Motion command to execute through JSB.
 * @returns The native play session handles or immediate visual values, depending on command type.
 */
export async function executeAnimateSpatializedElementMotion(
  elementId: string,
  targetKind: SpatializedMotionKind,
  command: ElementMotionCommand,
): Promise<
  AnimateSpatializedElementMotionResult | SpatializedVisualValues | void
> {
  const { animationId, type } = command
  const bridgeCommand: AnimateSpatializedElementMotionCommand = {
    ...command,
    targetKind,
    elementId: command.elementId ?? elementId,
  }

  if (type === 'play') {
    let resolveFinished!: (val: SpatializedVisualValues) => void
    let resolveCancel!: (val: SpatializedVisualValues) => void
    let resolveFailed!: (val: SpatializedPlaybackError) => void

    const finished = new Promise<SpatializedVisualValues>(r => {
      resolveFinished = r
    })
    const canceled = new Promise<SpatializedVisualValues>(r => {
      resolveCancel = r
    })
    const failed = new Promise<SpatializedPlaybackError>(r => {
      resolveFailed = r
    })

    const cleanup = () => removeMotionEventReceivers(animationId)

    addMotionEventReceivers(animationId, {
      onCompleted(data) {
        cleanup()
        const finalValues: SpatializedVisualValues =
          (data as any)?.finalValues ?? (data as any)?.values ?? data ?? {}
        resolveFinished(finalValues)
      },
      onCanceled(data) {
        cleanup()
        const currentValues: SpatializedVisualValues =
          (data as any)?.currentValues ?? (data as any)?.values ?? data ?? {}
        resolveCancel(currentValues)
      },
      onFailed(data) {
        cleanup()
        const payload = data as {
          animationId?: string
          command?: string
          code?: string
          reason?: string
        }
        resolveFailed({
          animationId: payload.animationId ?? animationId,
          command: (payload.command ??
            'play') as SpatializedPlaybackError['command'],
          code: payload.code,
          reason: payload.reason ?? `Native ${targetKind} motion failed`,
        })
      },
    })

    const result = await new AnimateSpatializedElementMotionJSBCommand(
      bridgeCommand,
    ).execute()
    if (!result.success) {
      cleanup()
      throw new Error(
        result.errorMessage ??
          `AnimateSpatializedElementMotion(${targetKind}) play command failed`,
      )
    }

    return { animationId, finished, canceled, failed }
  }

  const result = await new AnimateSpatializedElementMotionJSBCommand(
    bridgeCommand,
  ).execute()
  if (!result.success) {
    throw new Error(
      result.errorMessage ??
        `AnimateSpatializedElementMotion(${targetKind}) ${type} command failed`,
    )
  }

  if (
    type === 'pause' ||
    type === 'stop' ||
    type === 'reset' ||
    type === 'finish'
  ) {
    return result.data ? parseSpatializedVisualValues(result.data) : undefined
  }
}
