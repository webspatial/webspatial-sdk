import type { SpatialSceneCreationOptionsInternal } from '../types/internal'

/** Build query string for webspatial://createSpatialScene (url + config). */
export function buildSpatialSceneQuery(
  url: string,
  config: SpatialSceneCreationOptionsInternal | undefined,
): string {
  const params: Record<string, any> = { url, config }
  return Object.keys(params)
    .map(key => {
      const value = params[key]
      const finalValue =
        typeof value === 'object' ? JSON.stringify(value) : value
      return `${key}=${encodeURIComponent(finalValue)}`
    })
    .join('&')
}
