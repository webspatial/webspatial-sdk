import { createElement, type CSSProperties, type ReactNode } from 'react'
import { hasBootSpatialBeenCalled } from '../../runtime/boot'
import { isSpatialReady } from '../../runtime/bridge'
import { detectSpatialRuntime } from '../../runtime/detect'

let hasWarned = false

const diagnosticStyle: CSSProperties = {
  position: 'fixed',
  left: '16px',
  right: '16px',
  bottom: '16px',
  zIndex: 2147483647,
  boxSizing: 'border-box',
  padding: '12px 14px',
  border: '1px solid #b45309',
  borderRadius: '6px',
  background: '#fff7ed',
  color: '#7c2d12',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: '14px',
  lineHeight: '20px',
  pointerEvents: 'none',
}

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
export function warnBootForgotten(componentName: string): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return false
  }
  if (hasWarned) return false
  if (detectSpatialRuntime() === null) return false
  if (isSpatialReady()) return false
  if (hasBootSpatialBeenCalled()) return false

  hasWarned = true
  console.warn(
    `[WebSpatial] ${componentName} rendered fallback in a WebSpatial runtime because bootSpatial() may not have been awaited. Call \`await bootSpatial()\` from @webspatial/react-sdk before initial render.`,
  )
  return true
}

export function getBootForgottenDiagnostic(
  componentName: string,
): ReactNode | null {
  if (!warnBootForgotten(componentName)) return null

  return createElement(
    'div',
    {
      'data-webspatial-boot-forgotten': true,
      role: 'alert',
      style: diagnosticStyle,
    },
    `WebSpatial is rendering fallback UI because ${componentName} mounted before bootSpatial() ran. Wrap this subtree in <SpatialBoot> or call await bootSpatial() before rendering WebSpatial components.`,
  )
}

export function __resetBootForgottenWarningForTests(): void {
  hasWarned = false
}
