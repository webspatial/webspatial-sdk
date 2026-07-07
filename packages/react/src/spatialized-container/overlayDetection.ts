/**
 * Attribute that explicitly marks a nested `enable-xr` element as a floating
 * overlay surface (Scenario 3 / 5): content that a floating UI library (Radix,
 * Floating UI, Headless UI, react-aria, a custom `createPortal`, …) relocates
 * out of the parent SpatialDiv's content subtree so it can escape the parent's
 * 2D bounds.
 *
 * Usage: `<DropdownMenu.Content asChild><div enable-xr data-xr-overlay>…</div>`.
 */
export const SPATIAL_OVERLAY_ATTRIBUTE = 'data-xr-overlay'

/**
 * Overlay detection (Scenario 3 / 5).
 *
 * Overlay mode is opt-in and declarative: the developer (or a menu shell using
 * `SpatialOverlay`) marks the floating `enable-xr` surface with
 * `data-xr-overlay`. This is intentionally decoupled from any specific floating
 * library — we no longer sniff `data-radix-*` / `data-side` / `--radix-*`, which
 * bound detection to Radix internals and only resolved after the library
 * measured/positioned (causing render-time vs. instance-flag drift).
 *
 * A declarative marker is library-agnostic and known on the first render, so the
 * overlay flag is stable for the lifetime of the element.
 */
export function isSpatialOverlayContent(
  props: Record<string, unknown>,
): boolean {
  const value = props[SPATIAL_OVERLAY_ATTRIBUTE]
  return value != null && value !== false && value !== 'false'
}
