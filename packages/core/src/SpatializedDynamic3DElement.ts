import {
  AnimateSpatializedDynamic3DJSBCommand,
  SetParentForEntityCommand,
  UpdateSpatializedDynamic3DElementProperties,
} from './JSBCommand'
import { SpatialWebEvent } from './SpatialWebEvent'
import { parseSpatialDivVisualValues } from './spatialdiv/parseSpatialDivVisualValues'
import {
  Dynamic3DMotionController,
  type Dynamic3DMotionControllerOptions,
} from './dynamic3d/motion/Dynamic3DMotionController'
import type { SpatialDivMotionConfig } from './types/spatialDivMotion'
import type {
  AnimateSpatializedDynamic3DCommand,
  AnimateSpatializedDynamic3DResult,
} from './types/spatializedDynamic3dAnimation'
import type { SpatialDivPlaybackError } from './types/spatialDivPlayback'
import type { SpatialDivVisualValues } from './types/spatialDivVisual'
import { SpatialEntity } from './reality'
import { SpatializedElement } from './SpatializedElement'
import type { SpatializedMotionHandle } from './spatialized/motion/SpatializedMotionHandle'
import {
  SpatialEntityEventType,
  SpatialEntityOrReality,
  SpatializedElementProperties,
} from './types/types'

export class SpatializedDynamic3DElement extends SpatializedElement {
  children: SpatialEntityOrReality[] = []
  events: Record<string, (data: any) => void> = {}

  constructor(id: string) {
    super(id)
  }

  async addEntity(entity: SpatialEntity) {
    const ans = new SetParentForEntityCommand(entity.id, this.id).execute()
    this.children.push(entity)
    entity.parent = this
    return ans
  }

  addEvent(type: SpatialEntityEventType, callback: (data: any) => void) {
    this.events[type] = callback
  }

  removeEvent(eventName: SpatialEntityEventType) {
    if (this.events[eventName]) {
      delete this.events[eventName]
    }
  }

  dispatchEvent(evt: CustomEvent) {
    this.events[evt.type]?.(evt)
  }

  async updateProperties(properties: Partial<SpatializedElementProperties>) {
    return new UpdateSpatializedDynamic3DElementProperties(
      this,
      properties,
    ).execute()
  }

  // ---- Dynamic3D container motion (native timeline on element.transform) ----

  animateMotion(
    command: AnimateSpatializedDynamic3DCommand & { type: 'play' },
  ): Promise<AnimateSpatializedDynamic3DResult>
  animateMotion(
    command: AnimateSpatializedDynamic3DCommand & { type: 'pause' },
  ): Promise<SpatialDivVisualValues>
  animateMotion(command: AnimateSpatializedDynamic3DCommand): Promise<void>
  async animateMotion(
    command: AnimateSpatializedDynamic3DCommand,
  ): Promise<
    AnimateSpatializedDynamic3DResult | SpatialDivVisualValues | void
  > {
    const { animationId, type } = command

    if (type === 'play') {
      let resolveFinished!: (val: SpatialDivVisualValues) => void
      let resolveCancel!: (val: SpatialDivVisualValues) => void
      let resolveFailed!: (val: SpatialDivPlaybackError) => void

      const finished = new Promise<SpatialDivVisualValues>(r => {
        resolveFinished = r
      })
      const canceled = new Promise<SpatialDivVisualValues>(r => {
        resolveCancel = r
      })
      const failed = new Promise<SpatialDivPlaybackError>(r => {
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

      SpatialWebEvent.addEventReceiver(
        `${animationId}_canceled`,
        (data: any) => {
          cleanup()
          const currentValues: SpatialDivVisualValues =
            data?.currentValues ?? data?.values ?? data ?? {}
          resolveCancel(currentValues)
        },
      )

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
              'play') as SpatialDivPlaybackError['command'],
            code: data.code,
            reason: data.reason ?? 'Native dynamic3d motion failed',
          })
        },
      )

      const playCommand: AnimateSpatializedDynamic3DCommand = {
        ...command,
        elementId: command.elementId ?? this.id,
      }

      const result = await new AnimateSpatializedDynamic3DJSBCommand(
        playCommand,
      ).execute()
      if (!result.success) {
        cleanup()
        throw new Error(
          result.errorMessage ??
            'AnimateSpatializedDynamic3DElement play command failed',
        )
      }

      return { animationId, finished, canceled, failed }
    }

    const result = await new AnimateSpatializedDynamic3DJSBCommand(
      command,
    ).execute()
    if (!result.success) {
      throw new Error(
        result.errorMessage ??
          `AnimateSpatializedDynamic3DElement ${type} command failed`,
      )
    }

    if (type === 'pause') {
      return parseSpatialDivVisualValues(result.data)
    }
  }

  motion(
    config: SpatialDivMotionConfig,
    options?: Omit<Dynamic3DMotionControllerOptions, 'element'>,
  ): SpatializedMotionHandle {
    return new Dynamic3DMotionController(config, { ...options, element: this })
  }
}
