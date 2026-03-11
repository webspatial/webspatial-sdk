// Issue #970: WebSpatial does not support running inside iframes.
// Iframe removal does not trigger reliable cleanup in the child document,
// leading to leaked XR sessions, GPU contexts, and spatial entities.

let _isInIframe: boolean | null = null

export function isInIframe(): boolean {
  if (_isInIframe !== null) return _isInIframe
  try {
    _isInIframe = typeof window !== 'undefined' && window.self !== window.top
  } catch {
    // Cross-origin iframe — accessing window.top throws SecurityError
    _isInIframe = true
  }
  return _isInIframe
}

const IFRAME_WARNING = `[WebSpatial] Running WebSpatial inside an iframe is currently unsupported.
This can lead to resource leaks because iframe removal does not trigger reliable cleanup.
WebSpatial initialization has been disabled.`

let _warned = false

export function warnIfIframe(): void {
  if (isInIframe() && !_warned) {
    _warned = true
    console.warn(IFRAME_WARNING)
  }
}
