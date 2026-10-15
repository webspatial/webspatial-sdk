import { loadSpatialImpl } from './bridge'
import { detectSpatialRuntime } from './detect'

let hasBeenCalled = false

export async function bootSpatial(): Promise<void> {
  hasBeenCalled = true

  if (detectSpatialRuntime() === null) {
    return
  }

  await loadSpatialImpl()
}

/**
 * Returns `true` once `bootSpatial()` has been invoked at least once on this
 * page (independent of resolution / rejection / runtime gating). Consumed by
 * the facades' dev-mode "boot was forgotten" warning per spatial-lazy-load
 * spec's "Dev-mode warning when boot is forgotten in a WebSpatial runtime"
 * Scenario. NOT part of the documented public API.
 */
export function hasBootSpatialBeenCalled(): boolean {
  return hasBeenCalled
}

export function __resetBootStateForTests(): void {
  hasBeenCalled = false
}
