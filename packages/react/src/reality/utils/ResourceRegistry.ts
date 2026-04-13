import { SpatialObject } from '@webspatial/core-sdk'

export type ResourceType =
  | 'texture'
  | 'material'
  | 'geometry'
  | 'entity'
  | 'modelAsset'

/**
 * Namespaced registry so texture / material / entity / modelAsset ids cannot collide.
 *
 * Ordering: consumers that call `get()` must run after the matching `add()` (typically declare
 * resources earlier in `<Reality>` so their effects run first). There is no wait-for-registration;
 * missing keys return `undefined` from `get()`.
 */
export class ResourceRegistry {
  private resources: Map<string, Promise<SpatialObject>> = new Map()

  private makeKey(type: ResourceType, id: string): string {
    return `${type}:${id}`
  }

  add<T extends SpatialObject>(
    type: ResourceType,
    id: string,
    resource: Promise<T>,
  ): void {
    const key = this.makeKey(type, id)
    if (this.resources.has(key)) {
      console.warn(
        `[ResourceRegistry] Overwriting existing ${type} with id "${id}"`,
      )
    }
    this.resources.set(key, resource)
  }

  get<T extends SpatialObject>(
    type: ResourceType,
    id: string,
  ): Promise<T> | undefined {
    const key = this.makeKey(type, id)
    const p = this.resources.get(key)
    return p as Promise<T> | undefined
  }

  remove(type: ResourceType, id: string): void {
    const key = this.makeKey(type, id)
    this.resources.delete(key)
  }

  removeAndDestroy(type: ResourceType, id: string): void {
    const key = this.makeKey(type, id)
    const p = this.resources.get(key)
    if (p) {
      p.then(spatialObj => spatialObj.destroy()).catch(() => {})
    }
    this.resources.delete(key)
  }

  destroy(): void {
    const pending = Array.from(this.resources.values())
    this.resources.clear()

    pending.forEach(promise =>
      promise.then(spatialObj => spatialObj.destroy()).catch(() => {}),
    )
  }
}
