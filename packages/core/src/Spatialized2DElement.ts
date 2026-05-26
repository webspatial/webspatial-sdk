import {
  AddSpatializedElementToSpatialized2DElement,
  AnimateSpatialDivJSBCommand,
  UpdateSpatialized2DElementProperties,
} from './JSBCommand'
import { SpatialWebEvent } from './SpatialWebEvent'
import { parseSpatialDivVisualValues } from './spatialdiv/parseSpatialDivVisualValues'
import {
  SpatialDivMotionController,
  type SpatialDivMotionControllerOptions,
} from './spatialdiv/motion/SpatialDivMotionController'
import type { SpatializedMotionHandle } from './spatialized/motion/SpatializedMotionHandle'
import type { SpatialDivMotionConfig } from './types/spatialDivMotion'
import type {
  AnimateSpatialDivCommand,
  AnimateSpatialDivResult,
} from './types/spatialDivAnimation'
import type { SpatialDivPlaybackError } from './types/spatialDivPlayback'
import type { SpatialDivVisualValues } from './types/spatialDivVisual'
import { hijackWindowATag } from './scene-polyfill'
import { SpatializedElement } from './SpatializedElement'
import { Spatialized2DElementProperties } from './types/types'

/**
 * Represents a 2D HTML element that has been spatialized in 3D space.
 * This class handles the integration between 2D web content and the 3D spatial environment,
 * allowing HTML elements to be positioned and interacted with in spatial applications.
 */
export class Spatialized2DElement extends SpatializedElement {
  /**
   * Creates a new spatialized 2D element.
   * @param id Unique identifier for this element
   * @param windowProxy Reference to the window object containing the 2D content
   */
  constructor(
    id: string,
    readonly windowProxy: WindowProxy,
  ) {
    super(id)
    // Hijack anchor tag events to handle navigation within the spatial context
    hijackWindowATag(windowProxy)
  }

  /**
   * Updates the properties of this 2D element.
   * This can include size, position, background, and other visual properties.
   * @param properties Partial set of properties to update
   * @returns Promise resolving when the update is complete
   */
  async updateProperties(properties: Partial<Spatialized2DElementProperties>) {
    return new UpdateSpatialized2DElementProperties(this, properties).execute()
  }

  /**
   * Adds a child spatialized element to this 2D element.
   * This allows for creating hierarchical structures of spatial elements.
   * @param element The child element to add
   * @returns Promise resolving when the element is added
   */
  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialized2DElement(
      this,
      element,
    ).execute()
  }

  // ---- SpatialDiv Animation ----

  animateSpatialDiv(
    command: AnimateSpatialDivCommand & { type: 'play' },
  ): Promise<AnimateSpatialDivResult>
  animateSpatialDiv(
    command: AnimateSpatialDivCommand & { type: 'pause' },
  ): Promise<SpatialDivVisualValues>
  animateSpatialDiv(command: AnimateSpatialDivCommand): Promise<void>
  async animateSpatialDiv(
    command: AnimateSpatialDivCommand,
  ): Promise<AnimateSpatialDivResult | SpatialDivVisualValues | void> {
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
          // Native sends { type, values } - extract values as finalValues
          const finalValues: SpatialDivVisualValues =
            data?.finalValues ?? data?.values ?? data ?? {}
          resolveFinished(finalValues)
        },
      )

      SpatialWebEvent.addEventReceiver(
        `${animationId}_canceled`,
        (data: any) => {
          cleanup()
          // Native sends { type, values } - extract values as currentValues
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
          // Propagate async native failure to hook layer via failed promise
          resolveFailed({
            animationId: data.animationId ?? animationId,
            command: (data.command ??
              'play') as SpatialDivPlaybackError['command'],
            code: data.code,
            reason: data.reason ?? 'Native animation failed',
          })
        },
      )

      const playCommand: AnimateSpatialDivCommand = {
        ...command,
        elementId: command.elementId ?? this.id,
      }

      const result = await new AnimateSpatialDivJSBCommand(
        playCommand,
      ).execute()
      if (!result.success) {
        cleanup()
        throw new Error(
          result.errorMessage ??
            'AnimateSpatialized2DElement play command failed',
        )
      }

      return { animationId, finished, canceled, failed }
    }

    // pause / resume / cancel
    const result = await new AnimateSpatialDivJSBCommand(command).execute()
    if (!result.success) {
      throw new Error(
        result.errorMessage ??
          `AnimateSpatialized2DElement ${type} command failed`,
      )
    }

    if (type === 'pause') {
      return parseSpatialDivVisualValues(result.data)
    }
  }

  cleanupSpatialDivAnimationListeners(animationId: string) {
    SpatialWebEvent.removeEventReceiver(`${animationId}_completed`)
    SpatialWebEvent.removeEventReceiver(`${animationId}_canceled`)
    SpatialWebEvent.removeEventReceiver(`${animationId}_failed`)
  }

  /**
   * Create a motion controller bound to this spatialized 2D element.
   * Prefer {@link SpatialDivMotionController} for imperative playback; React apps
   * typically use `useSpatialDivMotion` instead.
   */
  motion(
    config: SpatialDivMotionConfig,
    options?: Omit<SpatialDivMotionControllerOptions, 'element'>,
  ): SpatializedMotionHandle {
    return new SpatialDivMotionController(config, {
      ...options,
      element: this,
    })
  }
}
