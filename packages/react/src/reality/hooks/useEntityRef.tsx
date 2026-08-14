import { useImperativeHandle } from 'react'
import {
  Vec3,
  SpatialEntity,
  SpatialModelEntity as CoreSpatialModelEntity,
} from '@webspatial/core-sdk'
import type { ModelAnimationController } from '@webspatial/core-sdk'
import { RealityContextValue } from '../context'

export interface EntityRefShape {
  convertFromEntityToEntity: (
    fromEntityId: string,
    toEntityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  convertFromEntityToReality: (
    entityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  convertFromRealityToEntity: (
    entityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  id: string | undefined
  name: string | undefined
  entity: SpatialEntity | null
}

/**
 * Ref shape exposed by `<ModelEntity>`. Extends the base entity ref with a
 * per-instance controller for the built-in animation clips of the model.
 */
export interface ModelEntityRef extends EntityRefShape {
  readonly modelAnimation: ModelAnimationController
}

export const useEntityRef = (
  ref: React.Ref<EntityRefShape>,
  instance: EntityRef,
) => {
  useImperativeHandle(ref, () => instance)
}

export class EntityRef implements EntityRefShape {
  private _entity: SpatialEntity | null
  private _ctx: RealityContextValue | null

  constructor(
    entity: SpatialEntity | null = null,
    ctx: RealityContextValue | null = null,
  ) {
    this._entity = entity
    this._ctx = ctx
  }

  updateEntity(entity?: SpatialEntity | null) {
    if (entity) this._entity = entity
  }

  updateCtx(ctx?: RealityContextValue | null) {
    if (ctx) this._ctx = ctx
  }

  destroy() {
    this._entity?.destroy()
  }

  get entity() {
    return this._entity
  }
  get id() {
    return this._entity?.userData?.id
  }
  get name() {
    return this._entity?.userData?.name
  }

  /**
   * Built-in model animation controller. Only available when the underlying
   * entity is a `SpatialModelEntity` (i.e. the ref belongs to a
   * `<ModelEntity>`); throws before the entity finishes creating.
   */
  get modelAnimation(): ModelAnimationController {
    const ent = this._entity
    if (!ent) throw new Error('Entity not ready')
    if (!(ent instanceof CoreSpatialModelEntity)) {
      throw new Error('modelAnimation is only available on ModelEntity refs')
    }
    return ent
  }

  async convertFromEntityToEntity(
    fromEntityId: string,
    toEntityId: string,
    position: Vec3,
  ): Promise<Vec3> {
    if (!this._entity) return position
    try {
      const fromEnt = await this._ctx?.resourceRegistry.get(fromEntityId)
      const toEnt = await this._ctx?.resourceRegistry.get(toEntityId)
      if (!fromEnt || !toEnt) return position
      const ret = await this._entity.convertFromEntityToEntity(
        fromEnt.id,
        toEnt.id,
        position,
      )
      return ret?.data ?? position
    } catch {
      return position
    }
  }

  async convertFromEntityToReality(
    entityId: string,
    position: Vec3,
  ): Promise<Vec3> {
    if (!this._entity) return position
    try {
      const ent = await this._ctx?.resourceRegistry.get(entityId)
      if (!ent) return position
      const ret = await this._entity.convertFromEntityToScene(ent.id, position)
      return ret?.data ?? position
    } catch {
      return position
    }
  }

  async convertFromRealityToEntity(
    entityId: string,
    position: Vec3,
  ): Promise<Vec3> {
    if (!this._entity) return position
    try {
      const ent = await this._ctx?.resourceRegistry.get(entityId)
      if (!ent) return position
      const ret = await this._entity.convertFromSceneToEntity(ent.id, position)
      return ret?.data ?? position
    } catch {
      return position
    }
  }
}

export function createEntityRefProxy(
  entity: SpatialEntity | null,
  ctx?: RealityContextValue | null,
): EntityRefShape {
  return new EntityRef(entity, ctx)
}
