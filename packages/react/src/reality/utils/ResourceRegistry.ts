import { SpatialObject } from '@webspatial/core-sdk'

/**
 * Tracks spatial resources (textures, materials, entities, …) by string id under one Reality.
 *
 * Native creation is async (`createTexture`, `createUnlitMaterial`, …). The map
 * stores `Promise<SpatialObject>` so `add(id, pendingCreation)` can run after `get(id)` — sibling
 * JSX order does not need to match registration order. Callers are responsible for using the
 * correct id for each resource kind (same as with string ids today).
 *
 * Callers can `await get(id)` before `add(id, promise)` runs: `get` returns a promise that
 * settles when something later calls `add` with the same id.
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

  get(id: string): Promise<SpatialObject> {
    const existing = this.resources.get(id)
    if (existing) {
      return existing
    }

    // Nothing registered yet — return a promise that add() will resolve (or reject on failure).
    const promise = new Promise<SpatialObject>((resolve, reject) => {
      this.deferreds.set(id, { resolve, reject })
    })
    this.resources.set(id, promise)
    return promise
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
    // Destroy runs when each creation promise settles — may finish after React unmount; still
    // required so native objects are released. Failures/no-ops are swallowed per promise.
    void Promise.allSettled(pending.map(p => p.then(obj => obj.destroy())))
  }
}
