import {
  SpatializedDynamic3DElement,
  SpatialObject,
  SpatialSession,
} from '@webspatial/core-sdk'
export class ResourceRegistry {
  private resources: Map<string, SpatialObject> = new Map()
  add<T extends SpatialObject>(id: string, resource: T) {
    this.resources.set(id, resource)
  }
  remove(id: string) {
    this.resources.delete(id)
  }
  get<T extends SpatialObject>(id: string) {
    return this.resources.get(id) as T
  }
  destroy() {
    this.resources.clear()
    // todo: dothings to clear resources
  }
}
