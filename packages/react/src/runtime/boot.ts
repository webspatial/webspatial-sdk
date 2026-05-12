import { loadSpatialImpl } from './bridge'
import { detectSpatialRuntime } from './detect'

export async function bootSpatial(): Promise<void> {
  if (detectSpatialRuntime() === null) {
    return
  }

  await loadSpatialImpl()
}
