import { createContext, useContext, type Context } from 'react'

/**
 * Context carrying the correct portal container for React-portaled overlay
 * content (Radix `Portal`, Headless UI, floating-ui) rendered from inside a
 * spatialized (`enable-xr`) subtree.
 *
 * Overlay libraries default their portals to `globalThis.document.body` —
 * the HOST page body. For triggers living inside a spatial panel that is
 * the wrong document (the popup renders on the flat page, not in the panel
 * the user is looking at) and the wrong coordinate space (the trigger rect
 * is measured in the child webview's viewport). `SpatializedContent`
 * provides this context with the child webview's `document.body` so nested
 * portals can opt into rendering inside the panel.
 *
 * The context object is anchored on `globalThis` (same pattern as
 * `runtime/entryRegistry.ts` and the portal-bridge registry) so the
 * provider in the lazily-loaded spatial chunk and the consumer hook in the
 * default entry — and even duplicate SDK module instances under HMR or a
 * linked SDK — always share one context identity.
 */
type SpatialPortalContainerContext = Context<HTMLElement | null>

const CONTEXT_KEY = '__WEBSPATIAL_PORTAL_CONTAINER_CONTEXT__'

type ContextGlobal = typeof globalThis & {
  [CONTEXT_KEY]?: SpatialPortalContainerContext
}

export function getSpatialPortalContainerContext(): SpatialPortalContainerContext {
  const g = globalThis as ContextGlobal
  let context = g[CONTEXT_KEY]
  if (!context) {
    context = createContext<HTMLElement | null>(null)
    context.displayName = 'SpatialPortalContainerContext'
    g[CONTEXT_KEY] = context
  }
  return context
}

/**
 * Returns the element that React-portaled overlay content (dropdown
 * submenus, popovers, tooltips) should use as its portal container so it
 * renders inside the current spatial panel instead of on the host page.
 *
 * - Inside an `enable-xr` subtree running spatially: the spatial panel's
 *   own `document.body` (a child webview document). Pass it to e.g.
 *   `<DropdownMenu.Portal container={container}>` — every nested Radix
 *   `Portal` part (Content AND SubContent) needs it.
 * - On the plain web, outside spatial content, or during SSR: `null`,
 *   which overlay libraries treat as "use the default" — so the same code
 *   works unchanged in 2D.
 *
 * Known limitation: content portaled into the panel is clipped to the
 * panel's webview bounds — a menu opened near the panel edge cannot hang
 * outside the panel.
 */
export function useSpatialPortalContainer(): HTMLElement | null {
  return useContext(getSpatialPortalContainerContext())
}
