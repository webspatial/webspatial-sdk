const FLOATING_STYLE_VAR_PREFIXES = ['--radix-', '--floating-']

/**
 * Scenario 3 overlay detection. A nested spatial element becomes an overlay
 * child surface when its host was portaled out of the parent content tree by a
 * floating UI library (Radix / floating-ui). We recognize the floating wrapper
 * via the props such libraries inject onto the `asChild` content node.
 *
 * Signals (any one is sufficient — all are floating-library specific):
 * - `data-radix-*` / `data-floating-ui-*` attributes;
 * - `data-side` / `data-align` (resolved popper placement);
 * - a `--radix-*` / `--floating-*` CSS custom property in `style`.
 *
 * `role` is intentionally NOT a signal on its own: a legitimate nested
 * `enable-xr` accessibility surface (e.g. `role="dialog"` / `role="menu"`)
 * inside a SpatialDiv must not be misclassified as an overlay. Radix content
 * always also carries `data-side`/`data-align` (and a `--radix-*` style var), so
 * real popovers are still detected.
 *
 * This is a stronger, more precise signal than "has a positioned ancestor", so
 * ordinary nested SpatialDivs (incl. absolute/fixed) are not misclassified.
 *
 * NOTE (follow-up, tasks 5b): a DOM-ancestor check ("cannot find a parent
 * SpatialID before the parent content root") can harden this further. The
 * render-time prop signal is used first because floating libraries measure and
 * position only after mount, and it already excludes the normal nested case.
 */
export function isFloatingOverlayContent(
  props: Record<string, unknown>,
): boolean {
  for (const key of Object.keys(props)) {
    if (key.startsWith('data-radix-') || key.startsWith('data-floating-ui')) {
      return true
    }
  }
  if (props['data-side'] != null || props['data-align'] != null) {
    return true
  }
  const style = props['style']
  if (style && typeof style === 'object') {
    for (const key of Object.keys(style as Record<string, unknown>)) {
      if (FLOATING_STYLE_VAR_PREFIXES.some(prefix => key.startsWith(prefix))) {
        return true
      }
    }
  }
  return false
}
