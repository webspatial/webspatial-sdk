import {
  SetParentForEntityCommand,
  UpdateSpatializedDynamic3DElementProperties,
} from './JSBCommand'
import { executeAnimateSpatializedElementMotion } from './spatialized/executeAnimateSpatializedElementMotion'
import {
  SpatializedMotionController,
  type SpatializedMotionControllerOptions,
} from './spatialized/motion/SpatializedMotionController'
import type { SpatializedMotionConfig } from './types/spatializedMotion'
import type {
  AnimateSpatializedElementMotionCommand,
  AnimateSpatializedElementMotionResult,
} from './types/spatializedElementMotion'
import type { SpatializedVisualValues } from './types/spatializedVisual'
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

  motion(
    config: SpatializedMotionConfig,
    options?: Omit<SpatializedMotionControllerOptions, 'element'>,
  ): SpatializedMotionHandle {
    return new SpatializedMotionController(config, 'dynamic3d', {
      ...options,
      element: this,
    })
  }
}
