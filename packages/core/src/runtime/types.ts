/**
 * Internal runtime classification (see OpenSpec `review.md`).
 * `puppeteer`: automation / test harness UA — not a product matrix row; see `supports()`.
 */
export type WebSpatialRuntimeType = 'visionos' | 'picoos' | 'puppeteer' | null

/** Snapshot returned by internal `getRuntime()` (not a public app API). */
export type WebSpatialRuntimeSnapshot = {
  type: WebSpatialRuntimeType
  shellVersion: string | null
}
