import {
  SpatializedDynamic3DElement,
  SpatialObject,
  SpatialSession,
} from '@webspatial/core-sdk'
export class ResourceRegistry {
  private resources: Map<string, Promise<SpatialObject>> = new Map()
  add<T extends SpatialObject>(id: string, resource: Promise<T>) {
    this.resources.set(id, resource)
  }
  remove(id: string) {
    this.resources.delete(id)
  }

  // Remove the resource by id and destroy it once resolved
  // This does not cancel in-flight creation; it schedules destruction after resolution
  removeAndDestroy(id: string) {
    const p = this.resources.get(id)
    if (p) {
      // Schedule destruction when the resource becomes available
      p.then(spatialObj => spatialObj.destroy()).catch(() => {
        // swallow rejection to avoid unhandled promise errors during teardown
      })
    }
    this.resources.delete(id)
  }
  get<T extends SpatialObject>(id: string) {
    return this.resources.get(id) as Promise<T>
  }
  destroy() {
    // Collect pending resources and clear registry immediately
    const pending = Array.from(this.resources.values())
    this.resources.clear()

    // Best-effort destroy for all resolved and future-resolving resources
    pending.forEach(promise =>
      promise
        .then(spatialObj => spatialObj.destroy())
        .catch(() => {
          // swallow rejection to avoid unhandled promise errors during teardown
        }),
    )
  }
}
