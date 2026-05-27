import {
  AddSpatializedElementToSpatialized2DElement,
  UpdateSpatialized2DElementProperties,
} from './JSBCommand'
import { SpatialWebEvent } from './SpatialWebEvent'
import { executeAnimateSpatializedElementMotion } from './spatialized/executeAnimateSpatializedElementMotion'
import {
  SpatializedMotionController,
  type SpatializedMotionControllerOptions,
} from './spatialized/motion/SpatializedMotionController'
import type { SpatializedMotionHandle } from './spatialized/motion/SpatializedMotionHandle'
import type { SpatializedMotionConfig } from './types/spatializedMotion'
import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
  ElementMotionCommand,
} from './types/spatializedElementMotion'
import type { SpatializedVisualValues } from './types/spatializedVisual'
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

  // ---- Spatialized element motion (unified JSB) ----

  animateMotion(
    command: AnimateSpatializedElementMotionCommand & { type: 'play' },
  ): Promise<AnimateSpatializedElementMotionResult>
  animateMotion(
    command: AnimateSpatializedElementMotionCommand & { type: 'pause' },
  ): Promise<SpatializedVisualValues>
  animateMotion(command: AnimateSpatializedElementMotionCommand): Promise<void>
  async animateMotion(
    command: AnimateSpatializedElementMotionCommand,
  ): Promise<
    AnimateSpatializedElementMotionResult | SpatializedVisualValues | void
  > {
    const { targetKind, ...rest } = command
    return executeAnimateSpatializedElementMotion(this.id, targetKind, rest)
  }

  /** @deprecated Use {@link animateMotion} — kept for `useSpatialDivAnimation` and legacy callers. */
  animateSpatialDiv(
    command: ElementMotionCommand & { type: 'play' },
  ): Promise<AnimateSpatializedElementMotionResult>
  animateSpatialDiv(
    command: ElementMotionCommand & { type: 'pause' },
  ): Promise<SpatializedVisualValues>
  animateSpatialDiv(command: ElementMotionCommand): Promise<void>
  async animateSpatialDiv(
    command: ElementMotionCommand,
  ): Promise<
    AnimateSpatializedElementMotionResult | SpatializedVisualValues | void
  > {
    return executeAnimateSpatializedElementMotion(
      this.id,
      'spatialized2d',
      command,
    )
  }

  cleanupSpatialDivAnimationListeners(animationId: string) {
    SpatialWebEvent.removeEventReceiver(`${animationId}_completed`)
    SpatialWebEvent.removeEventReceiver(`${animationId}_canceled`)
    SpatialWebEvent.removeEventReceiver(`${animationId}_failed`)
  }

  /**
   * Create a motion controller bound to this spatialized 2D element.
   * Prefer {@link SpatializedMotionController} for imperative playback; React apps
   * typically use `useSpatializedMotion({ kind: 'spatialized2d' })` instead.
   */
  motion(
    config: SpatializedMotionConfig,
    options?: Omit<SpatializedMotionControllerOptions, 'element'>,
  ): SpatializedMotionHandle {
    return new SpatializedMotionController(config, 'spatialized2d', {
      ...options,
      element: this,
    })
  }
}
