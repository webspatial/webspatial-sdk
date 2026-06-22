import { hasBootSpatialBeenCalled } from '../../runtime/boot'
import { isSpatialReady } from '../../runtime/bridge'
import { detectSpatialRuntime } from '../../runtime/detect'

let hasWarned = false

/**
 * One-shot dev-mode console warning when a facade renders fallback in a
 * WebSpatial runtime because `bootSpatial()` was never called.
 *
 * Per spatial-lazy-load spec Scenarios "Dev-mode warning when boot is forgotten
 * in a WebSpatial runtime" + "No dev-mode warning in non-WebSpatial browsers":
 *   - Plain web (`detectSpatialRuntime() === null`): silent — fallback IS the
 *     final intended display.
 *   - `bootSpatial()` already called (pending / rejected / succeeded): silent —
 *     the developer wired the boot path; this warning would be misleading.
 *   - Bridge ready (`isSpatialReady()` is true): silent — facade is about to
 *     render the real implementation anyway.
 *   - WebSpatial runtime + boot not yet called + bridge not ready: warn once.
 *
 * Stripped from production builds via `process.env.NODE_ENV` guard
 * (consumer bundlers / tsup minify dead-code).
 */
export function warnBootForgotten(componentName: string): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }
  if (hasWarned) return
  if (detectSpatialRuntime() === null) return
  if (isSpatialReady()) return
  if (hasBootSpatialBeenCalled()) return

  hasWarned = true
  console.warn(
    `[WebSpatial] ${componentName} rendered fallback in a WebSpatial runtime because bootSpatial() may not have been awaited. Call \`await bootSpatial()\` from @webspatial/react-sdk before initial render.`,
  )
}

export function __resetBootForgottenWarningForTests(): void {
  hasWarned = false
}
