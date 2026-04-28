import { SpatialObject } from '@webspatial/core-sdk'

/**
 * Tracks spatial resources (textures, materials, entities, …) by string id under one Reality.
 *
 * Callers can `await get(id)` before `add(id, promise)` runs: `get` returns a promise that
 * settles when something later calls `add` with the same id. That way component order in JSX
 * does not have to match registration order.
 */
export class ResourceRegistry {
  /** Every id maps to a promise — either the real resource from add(), or a placeholder until then. */
  private resources: Map<string, Promise<SpatialObject>> = new Map()
  /** If get() ran first, we stash resolve/reject so add() can complete the waiting promise. */
  private deferreds = new Map<
    string,
    {
      resolve: (value: SpatialObject) => void
      reject: (error: Error) => void
    }
  >()

  add<T extends SpatialObject>(id: string, resource: Promise<T>): void {
    this.resources.set(id, resource)

    // Anyone who awaited get(id) early is still holding the placeholder; wire them to this promise.
    const deferred = this.deferreds.get(id)
    if (deferred) {
      resource
        .then(deferred.resolve)
        .catch(err =>
          deferred.reject(err instanceof Error ? err : new Error(String(err))),
        )
      this.deferreds.delete(id)
    }
  }

  get<T extends SpatialObject>(id: string): Promise<T> {
    const existing = this.resources.get(id)
    if (existing) {
      return existing as Promise<T>
    }

    // Nothing registered yet — return a promise that add() will resolve (or reject on failure).
    const promise = new Promise<SpatialObject>((resolve, reject) => {
      this.deferreds.set(id, { resolve, reject })
    })
    this.resources.set(id, promise)
    return promise as Promise<T>
  }

  remove(id: string): void {
    this.resources.delete(id)
    this.deferreds.delete(id)
  }

  // Same as remove, but when the promise resolves, destroy the spatial object (best-effort).
  removeAndDestroy(id: string): void {
    const p = this.resources.get(id)
    if (p) {
      p.then(obj => obj.destroy()).catch(() => {})
    }
    this.resources.delete(id)
    this.deferreds.delete(id)
  }

  destroy(): void {
    // Reality is tearing down: fail any waiter that never saw add().
    for (const [id, deferred] of this.deferreds) {
      deferred.reject(
        new Error(`ResourceRegistry destroyed — "${id}" never resolved`),
      )
    }
    this.deferreds.clear()

    const pending = Array.from(this.resources.values())
    this.resources.clear()
    pending.forEach(p => p.then(obj => obj.destroy()).catch(() => {}))
  }
}
