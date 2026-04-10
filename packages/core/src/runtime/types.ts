/** Internal runtime classification (see OpenSpec `review.md`). */
export type WebSpatialRuntimeType = 'visionos' | 'picoos' | null

/** Snapshot returned by internal `getRuntime()` (not a public app API). */
export type WebSpatialRuntimeSnapshot = {
  type: WebSpatialRuntimeType
  shellVersion: string | null
}
