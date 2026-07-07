import { useEffect } from 'react'

import type { PortalInstanceObject } from '../context/PortalInstanceContext'
import { registerPortalDocumentBridge } from './registry'

/**
 * Registers a spatial portal's child-webview document with the portal
 * document bridge for the lifetime of the portaled content (same seam as
 * `useSyncHeadStyles`).
 *
 * The placeholder is resolved lazily on every use: `portalInstanceObject.dom`
 * is a cache that may be null before the first 2D-frame sync and may change
 * identity across remounts (and must never appear in a dependency array).
 */
export function usePortalDocumentBridge(
  windowProxy: WindowProxy | null | undefined,
  portalInstanceObject: PortalInstanceObject | null | undefined,
): void {
  useEffect(() => {
    if (!windowProxy || !portalInstanceObject) return

    return registerPortalDocumentBridge({
      windowProxy,
      getPlaceholder: () =>
        portalInstanceObject.dom ??
        portalInstanceObject.spatializedContainerObject.querySpatialDomBySpatialId(
          portalInstanceObject.spatialId,
        ) ??
        null,
    })
  }, [windowProxy, portalInstanceObject])
}
