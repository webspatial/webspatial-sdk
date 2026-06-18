// =============================================================================
// WebSpatial primitive marker — stable identity for `Model` / `Reality`.
//
// The JSX runtime (`jsx-shared.ts`) must short-circuit `Model` and `Reality`
// so the `enable-xr` marker never wraps them as a generic 2D spatialized
// container. It previously did this by reference equality against the FACADE
// `Model` / `Reality` imported from `internal/facades-client`. That breaks for
// the eager entry (`src/eager.ts`), whose `<Model>` resolves to the REAL
// implementation from `./spatial` — a different object identity than the
// default-entry facade — so a reference-equality check failed and
// `<Model enable-xr>` fell through to the 2D-container wrap path.
//
// We instead brand BOTH the facade and the real components with a stable
// string-valued, non-enumerable property. A string literal (not a `Symbol`)
// is intentional: the JSX runtime ships as its own build entry
// (`dist/jsx/jsx-runtime.js`) and may carry a duplicate copy of this module,
// so a module-scoped `Symbol()` would not compare equal across chunks. A
// string brand is stable regardless of how many copies of this module exist.
// =============================================================================

export const WEBSPATIAL_PRIMITIVE_MARKER = '__webspatialPrimitive__'

export type WebSpatialPrimitiveName = 'Model' | 'Reality'

/**
 * Brand a component (facade or real implementation) as a WebSpatial primitive
 * so the JSX runtime can identify it without relying on object-reference
 * equality. Returns the same component for ergonomic call sites.
 */
export function markWebSpatialPrimitive<T>(
  component: T,
  name: WebSpatialPrimitiveName,
): T {
  try {
    Object.defineProperty(component as object, WEBSPATIAL_PRIMITIVE_MARKER, {
      value: name,
      enumerable: false,
      configurable: true,
      writable: false,
    })
  } catch {
    // Best-effort: frozen / non-extensible exotic objects simply stay
    // unmarked. The JSX runtime degrades to "no bypass" for them, which is
    // the pre-existing (non-eager) behavior.
  }
  return component
}

/**
 * Return the primitive name a component is branded with, or `undefined` when
 * it is not a WebSpatial primitive.
 */
export function getWebSpatialPrimitiveName(
  type: unknown,
): WebSpatialPrimitiveName | undefined {
  if (
    type === null ||
    (typeof type !== 'object' && typeof type !== 'function')
  ) {
    return undefined
  }
  const value = (type as Record<string, unknown>)[WEBSPATIAL_PRIMITIVE_MARKER]
  return value === 'Model' || value === 'Reality' ? value : undefined
}
