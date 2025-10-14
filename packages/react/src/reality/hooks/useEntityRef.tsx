import { useEffect, useImperativeHandle, useRef } from 'react'
import { Vec3, SpatialEntity } from '@webspatial/core-sdk'
import { RealityContextValue, useRealityContext } from '../context'

export interface EntityRef {
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

export const useEntityRef = (
  ref: React.Ref<EntityRef>,
  entity: SpatialEntity | null,
) => {
  const ctx = useRealityContext()

  useImperativeHandle(ref, () => {
    return createEntityRefProxy(entity, ctx)
  }, [entity, ctx])
}

export class EntityRefImpl implements EntityRef {
  private _entity: SpatialEntity | null
  private _ctx: RealityContextValue | null

  constructor(
    entity: SpatialEntity | null = null,
    ctx: RealityContextValue | null = null,
  ) {
    this._entity = entity
    this._ctx = ctx
  }

  update(entity: SpatialEntity | null, ctx: RealityContextValue | null) {
    this._entity = entity
    this._ctx = ctx
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
): EntityRef {
  return new EntityRefImpl(entity, ctx)
}
