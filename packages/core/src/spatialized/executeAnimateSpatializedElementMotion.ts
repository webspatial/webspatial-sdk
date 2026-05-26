import { AnimateSpatializedElementMotionJSBCommand } from '../JSBCommand'
import { SpatialWebEvent } from '../SpatialWebEvent'
import { parseSpatialDivVisualValues } from '../spatialdiv/parseSpatialDivVisualValues'
import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
  ContainerElementMotionCommand,
} from '../types/spatializedElementMotion'
import type { SpatializedPlaybackError } from '../types/spatializedPlayback'
import type { SpatialDivVisualValues } from '../types/spatialDivVisual'
import type { SpatializedMotionKind } from '../types/spatializedMotion'

export async function executeAnimateSpatializedElementMotion(
  elementId: string,
  targetKind: Exclude<SpatializedMotionKind, 'spatialized2d'>,
  command: ContainerElementMotionCommand,
): Promise<
  AnimateSpatializedElementMotionResult | SpatialDivVisualValues | void
> {
  const { animationId, type } = command
  const bridgeCommand: AnimateSpatializedElementMotionCommand = {
    ...command,
    targetKind,
    elementId: command.elementId ?? elementId,
  }

  if (type === 'play') {
    let resolveFinished!: (val: SpatialDivVisualValues) => void
    let resolveCancel!: (val: SpatialDivVisualValues) => void
    let resolveFailed!: (val: SpatializedPlaybackError) => void

    const finished = new Promise<SpatialDivVisualValues>(r => {
      resolveFinished = r
    })
    const canceled = new Promise<SpatialDivVisualValues>(r => {
      resolveCancel = r
    })
    const failed = new Promise<SpatializedPlaybackError>(r => {
      resolveFailed = r
    })

    const cleanup = () => {
      SpatialWebEvent.removeEventReceiver(`${animationId}_completed`)
      SpatialWebEvent.removeEventReceiver(`${animationId}_canceled`)
      SpatialWebEvent.removeEventReceiver(`${animationId}_failed`)
    }

    SpatialWebEvent.addEventReceiver(
      `${animationId}_completed`,
      (data: any) => {
        cleanup()
        const finalValues: SpatialDivVisualValues =
          data?.finalValues ?? data?.values ?? data ?? {}
        resolveFinished(finalValues)
      },
    )

    SpatialWebEvent.addEventReceiver(`${animationId}_canceled`, (data: any) => {
      cleanup()
      const currentValues: SpatialDivVisualValues =
        data?.currentValues ?? data?.values ?? data ?? {}
      resolveCancel(currentValues)
    })

    SpatialWebEvent.addEventReceiver(
      `${animationId}_failed`,
      (data: {
        animationId: string
        command: string
        code?: string
        reason: string
      }) => {
        cleanup()
        resolveFailed({
          animationId: data.animationId ?? animationId,
          command: (data.command ??
            'play') as SpatializedPlaybackError['command'],
          code: data.code,
          reason: data.reason ?? `Native ${targetKind} motion failed`,
        })
      },
    )

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

  if (type === 'pause') {
    return parseSpatialDivVisualValues(result.data)
  }
}
